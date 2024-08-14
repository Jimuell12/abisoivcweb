import React from 'react'

function Nav() {
  return (
    <header className='absolute top-0 w-full'>
    <nav>
        <div className='h-20 flex flex-row gap-2 items-center'>
            <img className='h-full w-20' src="/images/abiso_logo.png" alt="" />
            <h1 className='text-3xl font-bold text-blue-500'>Abiso IVC</h1>
        </div>
    </nav>
  </header>
  )
}

export default Nav