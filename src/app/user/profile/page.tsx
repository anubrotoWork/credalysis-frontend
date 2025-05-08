'use client';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  const [loading, setLoading] = useState(true);
  const email = typeof window !== 'undefined' ? localStorage.getItem('email') : '';

  useEffect(() => {
    fetch(`http://34.55.216.204:8000/users/profile/${email}`)
      .then(res => res.json())
      .then(data => {
        // Split full name into first and last if needed (fallback)
        if (data.name && !data.first_name) {
          const [first, ...last] = data.name.split(' ');
          data.first_name = first;
          data.last_name = last.join(' ');
        }
        setProfile(data);
        setLoading(false);
      });
  }, [email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const payload = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      address: profile.address,
    };

    await fetch(`http://34.55.216.204:8000/users/profile/${email}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    alert('Profile updated!');
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            name="first_name"
            value={profile.first_name}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            name="last_name"
            value={profile.last_name}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            value={profile.email}
            disabled
            className="w-full mt-1 p-2 border bg-gray-100 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            name="address"
            value={profile.address}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input name="city" value={profile.city} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input name="state" value={profile.state} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
          <input name="zip_code" value={profile.zip_code} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
