'use client'
import React, { useState, useEffect } from 'react'
import Chatlist from './chatlist'
import { db, storage } from '../firebaseConfig'
import { onValue, push, ref } from 'firebase/database'
import { ref as storageRef, getDownloadURL, uploadBytes } from 'firebase/storage'

export default function Messages() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const messageRef = React.useRef<HTMLDivElement>(null);

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      sendImage(file);
    }
  };

  useEffect(() => {
    if (currentChatId) {
      fetchMessagesForChat(currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    messageRef.current?.scrollTo({
      top: messageRef.current?.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const fetchMessagesForChat = (chatId: string) => {
    const messagesRef = ref(db, `incidents/${chatId}/messages`);

    onValue(messagesRef, (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const fetchedMessages = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setMessages(fetchedMessages)
      } else {
        console.log('No messages available');
        setMessages([]);
      }
    });
  };

  const handleUserClick = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const sendMessage = () => {
    if (currentChatId && newMessage) {
      // Send message to database
      const newMessageRef = ref(db, `incidents/${currentChatId}/messages`)
      push(newMessageRef, {
        text: newMessage,
        timestamp: Date.now(),
        userType: 'rescuer',
        type: 'text',
      }).then(() => {
        setNewMessage('');
      });
    }

  };

  const sendImage = async (file: any) => {
    if (file) {
      console.log(file)
      const filename = file.name;
      const imageRef = storageRef(storage, `images/${filename}`);

      try {
        // Upload image
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Save message with image URL
        if (currentChatId) {
          const newMessageRef = ref(db, `incidents/${currentChatId}/messages`);
          await push(newMessageRef, {
            text: downloadURL,
            timestamp: Date.now(),
            userType: 'rescuer',
            type: 'image',
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      sendMessage();
    }
  };

  return (
    <div className='grid lg:grid-cols-6 h-screen '>
      <div className='lg:col-span-4 relative border-r border-gray-200'>
        <div className='flex flex-col h-screen'>
          <div ref={messageRef} className='flex-1 p-4 overflow-y-scroll'>
            {messages.length === 0 ? (
              <div className='flex items-center justify-center h-full'>
                <p className='text-gray-500 text-center'>Click the Message on the left. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userType === 'rescuer' ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`p-3 max-w-[75%] rounded-lg ${msg.userType === 'rescuer' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}
                  >
                    {msg.type === 'text' ? (
                      <span className='text-wrap whitespace-pre-line'>{msg.text}</span>
                    ) : msg.type === 'image' ? (
                      <img src={msg.text} alt="message" className='max-w-xs max-h-[300px] rounded-lg' />
                    ) : null}
                    <small className='block text-right text-xs'>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='flex items-center p-2 border-t border-gray-200'>
            <label htmlFor="file-upload" className='cursor-pointer'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
              </svg>
              <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} className='hidden' />
            </label>
            <textarea value={newMessage} rows={1} onKeyDown={handleKeyPress} onChange={(e) => setNewMessage(e.target.value)} className='w-full resize-none bg-gray-100 text-lg rounded-full border border-gray-200 py-2 px-4 mx-2' placeholder='Aa' />
            <button onClick={sendMessage} className='bg-blue-500 text-white rounded-full p-2'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>

        </div>

      </div>
      <div className='lg:col-span-2'>
        <h1 className='font-bold text-3xl px-4 py-2'>Chats</h1>
        <Chatlist onUserClick={handleUserClick} />
      </div>
    </div>
  )
}
