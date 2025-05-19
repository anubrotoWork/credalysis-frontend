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
  const [email, setEmail] = useState('');

  const backendApiUrl = "http://34.9.145.33:8000";

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    fetch(`${backendApiUrl}/users/profile/${email}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.name && !data.first_name) {
          const [first, ...last] = data.name.split(' ');
          data.first_name = first;
          data.last_name = last.join(' ');
        }
        setProfile(prevProfile => ({ ...prevProfile, ...data }));
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch profile:", error);
        setLoading(false);
      });
  }, [email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!email) {
      alert('Email is not available. Cannot save profile.');
      return;
    }
    const payload = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
    };

    try {
      const res = await fetch(`${backendApiUrl}/users/profile/${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      alert('Profile updated!');
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) return <div className="text-center mt-10 text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex flex-col items-center">
      <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 text-center">My Profile</h1>
        <div className="space-y-4">
          {/* First Name and Last Name side-by-side on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                id="first_name"
                name="first_name"
                value={profile.first_name || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                id="last_name"
                name="last_name"
                value={profile.last_name || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              value={profile.email || ''}
              disabled
              className="w-full mt-1 p-2 border border-gray-300 bg-gray-200 text-gray-500 rounded cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              id="phone"
              name="phone"
              value={profile.phone || ''}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input
              id="address"
              name="address"
              value={profile.address || ''}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded"
            />
          </div>

          {/* City, State, ZIP Code in a row on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <input
                id="city"
                name="city"
                value={profile.city || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
              <input
                id="state"
                name="state"
                value={profile.state || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded"
              />
            </div>
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                id="zip_code"
                name="zip_code"
                value={profile.zip_code || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition ease-in-out duration-150"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
