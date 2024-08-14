'use client'
import { get, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';

export default function Abiso() {
  const [message, setMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [Ipaddress, setIpaddress] = useState('');
  const [allPhoneNumbers, setAllPhoneNumbers] = useState<string[]>([]);

  useEffect(() => {
    const userRef = ref(db, 'users');
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const phoneNumbers: string[] = [];
        snapshot.forEach((uuidSnapshot) => {
          const user = uuidSnapshot.val();
          phoneNumbers.push(user.mobile);
          setAllPhoneNumbers(phoneNumbers);
        });
      } else {
        console.log('No data available');
      }
    }).catch((error) => {
      console.error('Error getting data:', error);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phones = allPhoneNumbers.join(',');


    const phoneNumbers = phones.split(',').map(num => num.trim());

    const formattedPhoneNumbers = phoneNumbers.map(num => `+63${num.replace(/^\+63/, '')}`).join(',');

    const formData = new URLSearchParams();
    formData.append('message', message);
    formData.append('phoneno', formattedPhoneNumbers);

    try {
      const response = await fetch(`http://${Ipaddress}:8080/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        mode: 'no-cors', // Use this workaround for CORS during development
      });

      // Since `mode: 'no-cors'` results in an opaque response, you won't be able to read the response body
      setResponseMessage('Request sent successfully (no response available due to CORS).');
    } catch (error) {
      console.error('Error:', error);
      setResponseMessage('Error occurred while sending the request');
    }
  };

  return (
<div className='grid lg:grid-cols-2 gap-6 p-4 h-screen'>
  <div className='lg:col-span-1 bg-white p-6 rounded-lg drop-shadow-md justify-center'>
    <h2 className='text-xl font-semibold mb-4'>Send Message to Users</h2>
    <form onSubmit={handleSubmit} className='flex flex-col'>
      <label htmlFor='Ipaddress' className='mb-2 font-medium text-gray-700'>IP Address:</label>
      <input
        type='text'
        id='Ipaddress'
        value={Ipaddress}
        onChange={(e) => setIpaddress(e.target.value)}
        className='mb-4 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
        placeholder='Enter IP address'
      />

      <label htmlFor='message' className='mb-2 font-medium text-gray-700'>Message:</label>
      <textarea
        id='message'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className='mb-4 p-3 resize-none border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
        placeholder='Enter your message'
        rows={8}
      />

      <button type='submit' className='p-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'>
        Send
      </button>
    </form>
    <p className='text-gray-600 mt-4'>{responseMessage}</p>
  </div>

  <div className='lg:col-span-1 bg-white p-6 rounded-lg drop-shadow-md'>
    <h2 className='text-2xl font-semibold mb-4'>How to Use the REST SMS Android App</h2>
    <p className='mb-4 text-gray-700'>
      This page allows you to send messages to all registered users through the REST SMS Android app. Follow the steps below to use the app effectively:
    </p>
    <ol className='list-decimal list-inside mb-6 text-gray-700'>
      <li className='mb-2'>
        <strong>Install the REST SMS Android App:</strong> Download and install the REST SMS app from the provided source.
      </li>
      <li className='mb-2'>
        <strong>Configure the App:</strong> Open the app to connect with the SMS server. Ensure that the app has the necessary permissions to send SMS.
      </li>
      <li className='mb-2'>
        <strong>Enter IP Address:</strong> In the input field below, enter the IP address of the server where the REST SMS service is running.
      </li>
      <li className='mb-2'>
        <strong>Compose Your Message:</strong> Write the message you want to send to all registered users in the message box provided.
      </li>
      <li className='mb-2'>
        <strong>Send the Message:</strong> Click the "Send" button to submit your message. The app will handle sending the SMS to all users registered in the system.
      </li>
      <li className='mb-2'>
        <strong>Check for Confirmation:</strong> After sending, you should receive a confirmation indicating whether the message was successfully sent or if there were any issues.
      </li>
    </ol>
    <p className='text-gray-600'>
      If you encounter any issues or need further assistance, please contact the app developer for support.
    </p>
  </div>
</div>

  );
}
