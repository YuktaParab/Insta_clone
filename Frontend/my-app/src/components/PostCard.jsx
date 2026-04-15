import React, { useState, useContext, useRef } from 'react';
import { FiMessageCircle, FiSend, FiBookmark, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const PostCard = ({ post, onDelete }) => {
  const { currentUser } = useContext(AuthContext);
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.username) || false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0); 
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(currentUser?.following?.includes(post.username) || false);
  const commentInputRef = useRef(null);
  
  // Check if initially saved
  const storageKey = `saved_posts_${currentUser?.username}`;
  const getSavedPosts = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  const [saved, setSaved] = useState(() => {
    return getSavedPosts().some(p => (p._id || p.id) === (post._id || post.id));
  });

  const handleSaveToggle = () => {
    const isNowSaved = !saved;
    setSaved(isNowSaved);
    
    let savedPosts = getSavedPosts();
    if (isNowSaved) {
      savedPosts.push(post);
    } else {
      savedPosts = savedPosts.filter(p => (p._id || p.id) !== (post._id || post.id));
    }
    localStorage.setItem(storageKey, JSON.stringify(savedPosts));
  };

  const handleLike = async () => {
    if (!currentUser) return;
    
    // Optimistic UI Update
    const isLiking = !liked;
    setLiked(isLiking);
    setLikeCount(prev => isLiking ? prev + 1 : Math.max(0, prev - 1));
    
    if (isLiking) {
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 800);
    }
    
    // Background API sync
    try {
        await api.post(`/post/${post._id || post.id}/like`, { 
            username: currentUser.username || currentUser.email || 'Anonymous' 
        });
    } catch(err) {
        console.error("Failed to sync like", err);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
    else {
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 800);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post._id || post.id}`;
    navigator.clipboard.writeText(postUrl);
    alert("Post Link copied to clipboard! ✈️");
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    
    const safeUsername = currentUser.username || currentUser.email || 'Anonymous';
    
    const tempComment = {
      username: safeUsername,
      text: commentText,
      id: Math.random().toString(),
      createdAt: new Date().toISOString()
    };
    
    setComments(prev => [...prev, tempComment]);
    setCommentText('');
    
    try {
      await api.post(`/post/${post._id || post.id}/comment`, {
         username: safeUsername,
         text: tempComment.text
      });
    } catch(err) {
      console.error("Failed to sync comment", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(true);
      await onDelete(post._id || post.id);
      setIsDeleting(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !post.username) return;
    
    setIsFollowing(!isFollowing); // Optimistic flip
    
    try {
       await api.post('/follow', {
           currentUsername: currentUser.username,
           targetUsername: post.username
       });
    } catch(err) {
       console.error("Follow error:", err);
       setIsFollowing(!isFollowing); // Revert on err
    }
  };

  // Determine image URL
  const imageUrl = post.file_url || post.imageUrl || post.image || post.path; 
  const imageSrc = imageUrl?.startsWith('http') ? imageUrl : `http://localhost:3000/${imageUrl?.replace(/\\/g, '/')}`;
  const timeAgo = post.upload_time || post.createdAt ? formatDistanceToNow(new Date(post.upload_time || post.createdAt), { addSuffix: true }) : 'Just now';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-md border border-gray-100/60 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 overflow-hidden max-w-[500px] w-full mx-auto relative group"
    >
      {/* Post Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
               <img 
                 src={`https://api.dicebear.com/7.x/notionists/svg?seed=${post.username}`} 
                 alt="avatar" 
                 className="w-full h-full bg-white rounded-full object-cover"
               />
             </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h3 className="font-bold text-[14px] text-gray-900 leading-tight hover:text-pink-600 transition-colors">
                  {post.username || 'unknown_user'}
               </h3>
               {currentUser?.username && post.username && currentUser?.username !== post.username && (
                 <>
                   <span className="text-gray-300 text-xs">•</span>
                   <button 
                     onClick={handleFollowToggle}
                     className={`text-[13px] font-bold transition-colors ${isFollowing ? 'text-gray-500' : 'text-pink-600 hover:text-pink-700'}`}
                   >
                     {isFollowing ? 'Following' : 'Follow'}
                   </button>
                 </>
               )}
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-[1px]">{timeAgo}</p>
          </div>
        </div>
        
        {/* Post Actions (Delete if owner) */}
        <div className="relative">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu(!showMenu)} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none text-gray-500"
          >
            <FiMoreHorizontal className="text-xl" />
          </motion.button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 mt-2 w-40 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50 z-20 py-2 overflow-hidden"
              >
                {currentUser?.username === post.username ? (
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <FiTrash2 className="text-lg" /> {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                ) : (
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    Report
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Image */}
      <div 
        className="relative bg-gradient-to-br from-gray-100 to-gray-200 w-full aspect-square flex items-center justify-center overflow-hidden cursor-pointer"
        onDoubleClick={handleDoubleTap}
      >
        <img 
          src={imageSrc} 
          alt="Post" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
        
        {/* Heart Animation Overlay */}
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div 
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.3, opacity: 0, transition: { duration: 0.3 } }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none drop-shadow-2xl"
            >
              <FaHeart className="text-white text-9xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Footer (Actions) */}
      <div className="p-4 pt-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <motion.button 
               whileTap={{ scale: 0.8 }}
               onClick={handleLike} 
               className="focus:outline-none"
            >
              {liked ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <FaHeart className="text-3xl text-pink-500 drop-shadow-sm" />
                </motion.div>
              ) : (
                <FaRegHeart className="text-3xl text-gray-800 hover:text-gray-500 transition-colors" />
              )}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => {
                setShowComments(true);
                setTimeout(() => commentInputRef.current?.focus(), 100);
              }} 
              className="focus:outline-none"
            >
              <FiMessageCircle className="text-3xl text-gray-800 hover:text-gray-500 transition-colors" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} className="focus:outline-none">
              <FiSend className="text-3xl text-gray-800 hover:text-gray-500 transition-colors transform -rotate-12 hover:-rotate-12 mt-[-2px]" />
            </motion.button>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
             onClick={handleSaveToggle}
            className="focus:outline-none"
          >
            <FiBookmark className={`text-3xl transition-colors ${saved ? 'text-gray-900 fill-current' : 'text-gray-800 hover:text-gray-500'}`} />
          </motion.button>
        </div>

        {/* Likes Count */}
        <p className="font-bold text-sm text-gray-900 mb-1 tracking-tight">{likeCount.toLocaleString()} likes</p>

        {/* Caption */}
        <div className="text-sm mt-1 leading-relaxed">
          <span className="font-bold text-gray-900 mr-2 cursor-pointer hover:underline">{post.username || 'unknown_user'}</span>
          <span className="text-gray-700 break-words">{post.caption}</span>
        </div>
        
        {/* Comments Hint & List */}
        {comments.length > 0 ? (
          <p 
            onClick={() => setShowComments(!showComments)} 
            className="text-sm text-gray-500 font-medium mt-2 cursor-pointer hover:text-gray-400 transition-colors"
          >
            {showComments ? 'Hide comments' : `View all ${comments.length} comments`}
          </p>
        ) : (
          <p className="text-sm text-gray-400 font-medium mt-2">No comments yet. Be the first!</p>
        )}
        
        <AnimatePresence>
          {showComments && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               className="mt-2 space-y-2 max-h-32 overflow-y-auto hide-scrollbar"
            >
              {comments.length > 0 ? comments.map((c, i) => (
                <div key={i} className="text-sm">
                  <span className="font-bold text-gray-900 mr-2">{c.username}</span>
                  <span className="text-gray-700">{c.text}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 italic">No comments to display.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleCommentSubmit} className="mt-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
               <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser?.username}`} className="w-full h-full bg-gray-100 object-cover" alt="me" />
            </div>
            <input 
              ref={commentInputRef}
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-gray-400 outline-none"
            />
            {commentText.trim() && (
              <button type="submit" className="text-pink-600 font-bold text-sm shrink-0 hover:text-pink-700">Post</button>
            )}
        </form>
      </div>
    </motion.div>
  );
};

export default PostCard;
