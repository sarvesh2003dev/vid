# VidStream - Video Sharing Platform

A YouTube-like video sharing platform built with Next.js, Firebase, and Tailwind CSS. VidStream allows users to upload, share, and discover videos with features like authentication, real-time comments, likes, and more.

## 🚀 Features

### Core Features
- **User Authentication** - Google Sign-In with Firebase Auth
- **Video Upload** - Upload MP4, MOV, or WebM files up to 500MB
- **Video Playback** - Full-screen video player with controls
- **Video Discovery** - Home feed with filtering and search
- **Engagement** - Like/unlike videos and add comments
- **User Profiles** - Customizable profiles with video collections
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Toggle between themes
- **Real-time Updates** - Live comments and video stats

### Technical Features
- **Firebase Integration** - Authentication, Firestore, Storage, Cloud Functions
- **Thumbnail Generation** - Automatic thumbnail creation using FFmpeg
- **Progress Tracking** - Upload progress bar and loading states
- **Error Handling** - Comprehensive error management and user feedback
- **Performance** - Optimized with Next.js App Router and image optimization

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety

### Backend
- **Firebase Authentication** - Google Sign-In
- **Cloud Firestore** - NoSQL database
- **Cloud Storage** - Video and thumbnail storage
- **Cloud Functions** - Thumbnail generation and cleanup

### Libraries
- **react-firebase-hooks** - Firebase hooks for React
- **react-hot-toast** - Toast notifications
- **next-themes** - Theme switching
- **react-icons** - Icon library

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with video feed
│   ├── upload/page.tsx    # Video upload page
│   ├── watch/[id]/page.tsx # Video playback page
│   └── profile/[uid]/page.tsx # User profile page
├── components/            # Reusable components
│   ├── Navbar.tsx         # Navigation header
│   ├── Sidebar.tsx        # Category sidebar
│   ├── VideoCard.tsx      # Video thumbnail card
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication hook
│   └── useVideo.ts        # Video operations hook
├── lib/                   # Utility functions
│   ├── firebase.ts        # Firebase configuration
│   └── utils.ts           # Helper functions
└── styles/
    └── globals.css        # Global styles
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vidstream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   
   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   
   b. Enable the following services:
      - **Authentication** (Google Sign-In)
      - **Cloud Firestore**
      - **Cloud Storage**
      - **Cloud Functions**
   
   c. Copy the Firebase configuration and create `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your Firebase configuration to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. **Set up Firebase CLI** (for Cloud Functions)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

5. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 Configuration

### Firebase Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all documents
    match /{document=**} {
      allow read: if true;
    }
    
    // Users can only write their own data
    match /users/{userId} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can create videos and update their own
    match /videos/{videoId} {
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users can add comments
    match /videos/{videoId}/comments/{commentId} {
      allow create: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow users to upload videos to their own folder
    match /videos/{userId}/{videoId} {
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 500 * 1024 * 1024  // 500MB limit
        && request.resource.contentType.matches('video/.*');
    }
    
    // Allow users to upload thumbnails
    match /thumbnails/{videoId} {
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard

### Deploy to Firebase Hosting

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

## 📱 Usage

### For Users
1. **Sign In** - Click "Sign In" and use your Google account
2. **Upload Videos** - Click "Upload" to share your content
3. **Browse Videos** - Use the sidebar to filter by category
4. **Engage** - Like videos and leave comments
5. **Manage Profile** - Click your avatar to edit your profile

### For Developers
1. **Authentication** - Uses Firebase Auth with Google Sign-In
2. **Database** - Firestore stores user and video metadata
3. **Storage** - Firebase Storage handles video and thumbnail files
4. **Functions** - Cloud Functions process thumbnails and cleanup
5. **Real-time** - Firestore listeners provide live updates

## 🔒 Security Considerations

- **Authentication Required** - Users must sign in to upload, like, or comment
- **File Validation** - Server-side validation of file types and sizes
- **Rate Limiting** - Implement rate limiting for uploads and comments
- **Content Moderation** - Add moderation features for reported content
- **HTTPS Only** - All communications use secure connections

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update `src/styles/globals.css` for global styles
- Components use Tailwind CSS classes for styling

### Features
- Add new categories in `src/components/Sidebar.tsx`
- Extend video metadata in `src/hooks/useVideo.ts`
- Add new engagement features (subscriptions, playlists, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check this README and inline code comments
- **Issues** - Report bugs and request features on GitHub
- **Firebase Docs** - [Firebase Documentation](https://firebase.google.com/docs)
- **Next.js Docs** - [Next.js Documentation](https://nextjs.org/docs)

## 🙏 Acknowledgments

- **Firebase Team** - For the amazing backend services
- **Next.js Team** - For the powerful React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Community** - For all the open-source contributions

---

Built with ❤️ by the VidStream Team