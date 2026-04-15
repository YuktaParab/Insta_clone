import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { AuthContext } from '../context/AuthContext';
import { FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Feed = () => {
  const { currentUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock Stories
  const stories = [
    { id: 1, user: 'sarah_designs', color: 'from-pink-500 to-orange-400' },
    { id: 2, user: 'mike_code', color: 'from-purple-500 to-pink-500' },
    { id: 3, user: 'emma_ux', color: 'from-pink-500 to-orange-400' },
    { id: 4, user: 'alex_dev', color: 'from-purple-500 to-pink-500' },
    { id: 5, user: 'chris_art', color: 'from-orange-400 to-red-400' },
    { id: 6, user: 'design_daily', color: 'from-pink-500 to-orange-400' },
    { id: 7, user: 'web_master', color: 'from-purple-500 to-pink-500' },
  ];

  const fetchPosts = async () => {
    try {
      const response = await api.get('/files');
      const data = response.data.files || response.data || [];
      const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.upload_time || b.createdAt) - new Date(a.upload_time || a.createdAt)) : [];
      setPosts(sorted);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch posts. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/delete/${id}`);
      setPosts(posts.filter(post => (post._id || post.id) !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete the post');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        {/* Skeleton rendering */}
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-white/50 border border-gray-100 rounded-[28px] p-4 max-w-[500px] w-full mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="w-full aspect-square bg-gray-200 rounded-2xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto py-8 px-4 sm:px-0">
      
      {/* Stories Section */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100/60 rounded-3xl p-4 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 items-center">
          {/* Add your story */}
          <div className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-100">
               <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser?.username}`} className="w-full h-full object-cover bg-gray-50" alt="Your story" />
               <div className="absolute inset-x-0 bottom-0 top-0 bg-black/10"></div>
               <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-[2px] border-2 border-white">
                 <FiPlus className="text-white text-xs" />
               </div>
            </div>
            <span className="text-[11px] font-medium text-gray-500">Your story</span>
          </div>

          {/* User Stories */}
          {stories.map(story => (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={story.id} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
              <div className={`p-[2px] rounded-full bg-gradient-to-tr ${story.color}`}>
                <div className="w-15 h-15 rounded-full border-2 border-white overflow-hidden bg-white">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${story.user}`} className="w-full h-full object-cover" alt={story.user} />
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-900 w-16 truncate text-center">{story.user}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md text-red-600 p-4 rounded-xl text-center mb-6 font-medium shadow-sm border border-red-100">
          {error}
        </div>
      )}

      {posts.length === 0 && !error ? (
        <div className="text-center py-24 bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPlus className="text-4xl text-pink-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">Be the very first one to share a moment!</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {posts.map((post) => (
            <PostCard key={post._id || post.id || Math.random()} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
      
      {/* Loading infinite scroll skeleton at bottom */}
      {!loading && posts.length > 0 && (
         <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
         </div>
      )}
    </div>
  );
};

export default Feed;
