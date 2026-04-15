import React from 'react';
import { motion } from 'framer-motion';

const Notifications = () => {
  const notifications = [
    { id: 1, user: 'alex_dev', type: 'like', time: '2m', postImage: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74' },
    { id: 2, user: 'sarah_designs', type: 'follow', time: '1h' },
    { id: 3, user: 'mike_code', type: 'comment', time: '3h', content: 'This looks amazing! 🔥', postImage: 'https://images.unsplash.com/photo-1682687982501-1e58f81bef36' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-full">
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
        Notifications
      </h2>
      
      <div className="space-y-4">
        {notifications.map((notif) => (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            key={notif.id} 
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shrink-0 bg-gradient-to-tr from-yellow-400 to-pink-500 p-[2px]">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${notif.user}`} className="w-full h-full bg-white rounded-full object-cover" alt={notif.user} />
              </div>
              <div>
                <p className="text-sm text-gray-900 leading-tight">
                  <span className="font-semibold">{notif.user} </span>
                  {notif.type === 'like' && 'liked your post.'}
                  {notif.type === 'follow' && 'started following you.'}
                  {notif.type === 'comment' && `commented: ${notif.content}`}
                </p>
                <span className="text-xs text-gray-500 font-medium">{notif.time}</span>
              </div>
            </div>
            
            {/* Right side interaction indicator */}
            {notif.type === 'follow' ? (
              <button className="px-4 py-1.5 bg-gray-900 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-colors">
                Follow
              </button>
            ) : notif.postImage ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img src={notif.postImage} alt="Post" className="w-full h-full object-cover" />
              </div>
            ) : null}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
