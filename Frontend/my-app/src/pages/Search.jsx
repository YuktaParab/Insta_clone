import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Search = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">Search</h2>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 group-focus-within:text-pink-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-10 py-3 bg-gray-100 border-transparent rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:border-pink-300 focus:ring-0 focus:shadow-[0_0_0_2px_rgba(236,72,153,0.2)] transition-all outline-none"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Results / Recent */}
      <div className="flex-1">
        {query ? (
           <div className="flex justify-center items-center h-32 text-gray-500 text-sm">
             Searching for "{query}"... (Mock)
           </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Recent</h3>
              <button className="text-sm font-semibold text-pink-600 hover:text-pink-700">Clear all</button>
            </div>
            
            {/* Mock recent searches array map */}
            <div className="space-y-4">
               {['alex_dev', 'sarah_designs', 'react_guru'].map((user) => (
                  <motion.div whileHover={{ scale: 1.01 }} key={user} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border border-gray-100 overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user}`} alt={user} className="w-full h-full object-cover bg-gray-100" />
                        </div>
                        <div>
                           <p className="font-medium text-sm text-gray-900">{user}</p>
                           <p className="text-xs text-gray-500">User</p>
                        </div>
                     </div>
                     <FiX className="text-gray-400 hover:text-gray-600" />
                  </motion.div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
