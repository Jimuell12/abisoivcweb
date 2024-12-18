import fetch from 'node-fetch';

export async function POST(req) {
  const url = 'https://spider-holy-crow.ngrok-free.app/send';

  try {
    const formData = await req.formData();

    const dataToSend = new URLSearchParams();
    dataToSend.append('message', formData.get('message'));
    dataToSend.append('phoneno', formData.get('phoneno'));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: dataToSend.toString(),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
