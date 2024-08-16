'use client'
import { onValue, ref, update } from 'firebase/database'
import React, { use, useEffect, useState } from 'react'
import { db } from '../firebaseConfig'

export default function Users() {

  const [users, setUsers] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = ref(db, 'users/')

    const fetchData = () => {
      const data = onValue(usersRef, (snapshot) => {
        const users = snapshot.val()
        const usersList = Object.keys(users).map(key => ({
          id: key,
          ...users[key]
        }))
        setUsers(usersList)
      })
    };

    const unsubscribe = onValue(usersRef, fetchData);

    return () => unsubscribe()
  }, [])

  const handleMenuToggle = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleRoleChange = (id: string, newRole: string) => {
    const userRef = ref(db, `users/${id}`);
    update(userRef, {role: newRole});
    setOpenMenuId(null);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const handleRoleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value === 'all' ? null : event.target.value);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = (
      (user.name && user.name.toLowerCase().includes(searchQuery)) ||
      (user.email && user.email.toLowerCase().includes(searchQuery)) ||
      (user.mobile && user.mobile.includes(searchQuery))
    );

    const matchesRole = selectedRole ? user.role === selectedRole : true;

    return matchesSearch && matchesRole;
  });

  return (
    <div className='p-10 h-screen'>
      <h1 className='font-bold text-3xl'>User management</h1>
      <p className='text-gray-500 font-semibold'>Manage your user members and their account account permission here</p>
      <div className='my-10 flex flex-row justify-between'>
        <h1 className='text-[#121212] text-xl font-bold'>All Users <span className='text-gray-400'>{users.length}</span></h1>
        <div className='flex flex-row gap-2'>
          <div className='flex flex-row items-center px-4 py-2 border border-gray-300 gap-2 rounded-lg text-gray-400'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" className='text-black outline-none' placeholder='Search' value={searchQuery} onChange={handleSearch} />
          </div>
          <div className='flex flex-row cursor-pointer items-center px-4 py-2 border border-gray-300 gap-2 rounded-lg'>
            <select className='text-black cursor-pointer outline-none' value={selectedRole || 'all'} onChange={handleRoleFilterChange}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="rescuer">Rescuer</option>
            </select>
          </div>
          
        </div>
      </div>
      <div className='overflow-x-auto max-h-[70vh]'>
        <table className="min-w-full rounded-2xl overflow-hidden">
          <thead className="bg-gray-50 whitespace-nowrap">
            <tr>
              <th className="p-4 text-left text-sm font-bold text-gray-500">User name</th>
              <th className="p-4 text-left text-sm font-bold text-gray-500">Mobile No.</th>
              <th className="p-4 text-left text-sm font-bold text-gray-500">Role</th>
              <th className="p-4 text-left text-sm font-bold text-gray-500">Last active</th>
              <th className="p-4 text-left text-sm font-bold text-gray-500">Date Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap">
            {filteredUsers.map((user: any) => (
              <tr key={user.id} className='hover:bg-gray-50'>
                <th className="p-4 text-sm">
                  <div
                    className="p-2 flex items-center"
                  >
                    <div className="flex-shrink-0 rounded-full h-12 w-12 overflow-hidden mr-4">
                      <img
                        className="h-full w-full object-cover rounded-full"
                        src={user.imageUrl ? user.imageUrl : 'https://cdn-icons-png.flaticon.com/512/10337/10337609.png'}
                        alt={user.name}
                      />
                    </div>
                    <div className='space-y-1'>
                      <strong className="block text-base font-bold text-left">{user.name}</strong>
                      <p className='text-sm font-normal'>{user.email}</p>
                    </div>
                  </div>
                </th>
                <th className="p-4 text-sm text-gray-500 text-left">{user.mobile}</th>
                <th className="p-4 text-sm text-left">
                  <div>
                    <span className={`px-2 py-1 font-bold ${user.role === 'rescuer' ? "text-green-600 bg-green-50 border-green-600" : user.role ===
                      'admin' ? "text-red-600 bg-red-50 border-red-600" : "text-blue-600 bg-blue-50 border-blue-600"} border rounded-full capitalize`}>{user.role}</span>
                  </div>
                </th>
                <th className="p-4 text-sm text-gray-500 text-left">{new Date(user.update).toLocaleDateString('en', { month: 'long', day: '2-digit', year: 'numeric' })}</th>
                <th className="p-4 text-sm text-gray-500 text-left">{new Date(user.added).toLocaleDateString('en', { month: 'long', day: '2-digit', year: 'numeric' })}</th>
                <th key={user.id} className="relative">
                  <button onClick={() => handleMenuToggle(user.id)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                      />
                    </svg>
                  </button>
                  {openMenuId === user.id && (
                    <div className="absolute top-0 right-5 bg-white border rounded-lg shadow-lg z-10">
                      <button
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => handleRoleChange(user.id, "user")}
                      >
                        to User
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => handleRoleChange(user.id, "rescuer")}
                      >
                        to Rescuer
                      </button>
                    </div>
                  )}
                </th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
