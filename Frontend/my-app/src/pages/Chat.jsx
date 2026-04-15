import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiSend, FiInfo, FiPhone, FiVideo } from 'react-icons/fi';
import { io } from 'socket.io-client';

const Chat = () => {
  const { currentUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'alex_dev', text: 'Hey, love the new InstaVibe app!', time: '10:00 AM' },
    { id: 2, sender: currentUser?.username, text: 'Thanks! It was fun building it.', time: '10:05 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeUser, setActiveUser] = useState('alex_dev');
  
  const messagesEndRef = useRef(null);
  
  // Example Socket connecting (If backend has it, otherwise this safely fails or we can mock responses)
  const socketRef = useRef(null);

  useEffect(() => {
    // Attempting to connect to socket server
    socketRef.current = io('http://localhost:3000', {
       auth: { token: localStorage.getItem('token') }
    });

    socketRef.current.on('receive_message', (msg) => {
       setMessages(prev => [...prev, msg]);
    });

    return () => {
       socketRef.current.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: currentUser?.username,
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');

    // Emit if socket is connected
    socketRef.current?.emit('send_message', newMsg);

    // Mock auto-reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: activeUser,
        text: `Echo: ${newMsg.text}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // Mock friends list
  const friends = ['alex_dev', 'sarah_designs', 'mike_code', 'emma_ux'];

  return (
    <div className="h-[calc(100vh-80px)] md:h-screen lg:h-screen py-4 md:py-8 px-2 md:px-0 max-w-5xl mx-auto flex">
      <div className="bg-white w-full flex rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Sidebar / Users List */}
        <div className="w-1/3 border-r border-gray-100 hidden sm:flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-lg">{currentUser?.username}</h2>
            <FiInfo className="text-xl text-gray-500 hover:text-gray-800 cursor-pointer" />
          </div>
          <div className="p-2 overflow-y-auto">
            {friends.map((friend) => (
              <div 
                key={friend} 
                onClick={() => setActiveUser(friend)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeUser === friend ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 p-[2px]">
                   <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-sm text-gray-700">
                     {friend.charAt(0).toUpperCase()}
                   </div>
                </div>
                <div className="hidden lg:block overflow-hidden">
                  <p className="font-medium text-sm truncate">{friend}</p>
                  <p className="text-xs text-gray-500 truncate">Tap to chat</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-gray-50/50">
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 p-[2px]">
                 <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-gray-700">
                   {activeUser.charAt(0).toUpperCase()}
                 </div>
              </div>
              <div>
                <p className="font-semibold text-sm">{activeUser}</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <div className="flex gap-4">
               <FiPhone className="text-xl text-gray-600 hover:text-purple-600 cursor-pointer transition-colors" />
               <FiVideo className="text-xl text-gray-600 hover:text-purple-600 cursor-pointer transition-colors" />
               <FiInfo className="text-xl text-gray-600 hover:text-purple-600 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((msg) => {
              const isMe = msg.sender === currentUser?.username;
              return (
                <div key={msg.id} className={`flex max-w-[75%] ${isMe ? 'self-end' : 'self-start'}`}>
                  <div className={`p-3 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    {msg.text}
                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Message..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-pink-300 focus:ring-0 rounded-full px-4 py-2 text-sm transition-all focus:shadow-[0_0_0_2px_rgba(236,72,153,0.2)] outline-none"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2 rounded-full text-pink-500 hover:bg-pink-50 transition-colors disabled:opacity-50"
              >
                <FiSend className="text-xl transform rotate-45" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
