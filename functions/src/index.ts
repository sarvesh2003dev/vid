import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

export const generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    // Only process video files
    if (!object.name?.startsWith('videos/') || !object.contentType?.startsWith('video/')) {
      return null;
    }

    const fileBucket = object.bucket;
    const filePath = object.name;
    const fileName = path.basename(filePath);
    const thumbFileName = `thumb_${fileName.replace(/\.(mp4|mov|webm)$/i, '.jpg')}`;
    const tempLocalFile = path.join(os.tmpdir(), fileName);
    const tempLocalThumbFile = path.join(os.tmpdir(), thumbFileName);

    console.log('Processing video:', filePath);

    try {
      // Download the video file
      await storage.bucket(fileBucket).file(filePath).download({
        destination: tempLocalFile
      });

      console.log('Video downloaded to:', tempLocalFile);

      // Generate thumbnail using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempLocalFile)
          .screenshots({
            timestamps: ['10%'], // Take screenshot at 10% of video duration
            filename: thumbFileName,
            folder: os.tmpdir(),
            size: '1280x720' // HD thumbnail
          })
          .on('end', () => {
            console.log('Thumbnail generated:', tempLocalThumbFile);
            resolve();
          })
          .on('error', (err) => {
            console.error('Error generating thumbnail:', err);
            reject(err);
          });
      });

      // Upload thumbnail to storage
      const thumbFilePath = filePath.replace(/videos\/(.*)\.(mp4|mov|webm)$/i, 'thumbnails/$1.jpg');
      await storage.bucket(fileBucket).upload(tempLocalThumbFile, {
        destination: thumbFilePath,
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            originalVideo: filePath
          }
        }
      });

      console.log('Thumbnail uploaded to:', thumbFilePath);

      // Get the video document and update with thumbnail URL
      const videoId = fileName.split('.')[0];
      const videosRef = db.collection('videos');
      const videoQuery = await videosRef.where('videoUrl', 'like', `%${fileName}%`).limit(1).get();

      if (!videoQuery.empty) {
        const videoDoc = videoQuery.docs[0];
        const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${fileBucket}/o/${encodeURIComponent(thumbFilePath)}?alt=media`;
        
        await videoDoc.ref.update({
          thumbnailUrl: thumbnailUrl
        });

        console.log('Video document updated with thumbnail URL');
      }

      // Clean up temp files
      fs.unlinkSync(tempLocalFile);
      fs.unlinkSync(tempLocalThumbFile);

      return null;
    } catch (error) {
      console.error('Error in generateThumbnail:', error);
      
      // Clean up temp files on error
      if (fs.existsSync(tempLocalFile)) {
        fs.unlinkSync(tempLocalFile);
      }
      if (fs.existsSync(tempLocalThumbFile)) {
        fs.unlinkSync(tempLocalThumbFile);
      }
      
      throw error;
    }
  });

export const updateVideoStats = functions.firestore
  .document('videos/{videoId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Check if views or likes changed
    if (newData.views !== previousData.views || newData.likes !== previousData.likes) {
      try {
        // Update user's total stats
        const userRef = db.collection('users').doc(newData.userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          // Get all videos by this user to calculate totals
          const userVideos = await db.collection('videos')
            .where('userId', '==', newData.userId)
            .get();
          
          let totalViews = 0;
          let totalLikes = 0;
          
          userVideos.forEach((doc) => {
            const videoData = doc.data();
            totalViews += videoData.views || 0;
            totalLikes += videoData.likes || 0;
          });
          
          await userRef.update({
            totalViews,
            totalLikes,
            videoCount: userVideos.size
          });
        }
      } catch (error) {
        console.error('Error updating user stats:', error);
      }
    }
    
    return null;
  });

export const cleanupStorage = functions.firestore
  .document('videos/{videoId}')
  .onDelete(async (snap, context) => {
    const videoData = snap.data();
    
    try {
      // Delete video file from storage
      if (videoData.videoUrl) {
        const videoPath = videoData.videoUrl.match(/\/o\/(.+)\?alt=media/);
        if (videoPath && videoPath[1]) {
          const decodedPath = decodeURIComponent(videoPath[1]);
          await storage.bucket().file(decodedPath).delete();
          console.log('Deleted video file:', decodedPath);
        }
      }
      
      // Delete thumbnail file from storage
      if (videoData.thumbnailUrl) {
        const thumbPath = videoData.thumbnailUrl.match(/\/o\/(.+)\?alt=media/);
        if (thumbPath && thumbPath[1]) {
          const decodedPath = decodeURIComponent(thumbPath[1]);
          await storage.bucket().file(decodedPath).delete();
          console.log('Deleted thumbnail file:', decodedPath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up storage:', error);
    }
    
    return null;
  });