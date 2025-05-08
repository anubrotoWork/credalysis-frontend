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
  // Ensure localStorage is accessed only on the client
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);


  useEffect(() => {
    if (!email) {
      // If email is not yet set (e.g., on initial render before client-side useEffect runs)
      // or if no email is in localStorage, we might not want to fetch yet, or handle appropriately.
      // For now, if email is empty, we might set loading to false or show a message.
      // Or, ensure the fetch only runs when email is available.
      if (!localStorage.getItem('email')) { // Check again to prevent fetching with an empty string if it wasn't set
        setLoading(false); // Or set an error state
        return;
      }
    }

    fetch(`http://34.55.216.204:8000/users/profile/${email}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Split full name into first and last if needed (fallback)
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
        // Optionally set an error state here to display to the user
        setLoading(false);
      });
  }, [email]); // Depend on the email state

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
      // Assuming your backend might also want city, state, zip_code if they are editable
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
    };

    try {
      const res = await fetch(`http://34.55.216.204:8000/users/profile/${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      // const data = await res.json(); // If you need to process response
      alert('Profile updated!');
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) return <div className="text-center mt-10 text-gray-100">Loading...</div>; // Added text color

  // Added a wrapper div to ensure the dark background applies if this component doesn't fill the screen
  // or if the parent page doesn't have a dark background.
  // If your layout already handles the dark background, you might not need this outer div.
  return (
    <div className="min-h-screen bg-gray-900 py-10 flex flex-col items-center"> {/* Outer wrapper for dark bg */}
      <div className="max-w-2xl w-full p-6 bg-gray-800 rounded-lg shadow-md"> {/* Changed bg */}
        <h1 className="text-2xl font-semibold mb-6 text-gray-100 text-center">My Profile</h1> {/* Added text color, increased mb, centered */}
        <div className="space-y-4">
          {/* First Name and Last Name side-by-side on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">First Name</label> {/* Changed text color */}
              <input
                id="first_name"
                name="first_name"
                value={profile.first_name || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded" // Dark mode styles
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">Last Name</label> {/* Changed text color */}
              <input
                id="last_name"
                name="last_name"
                value={profile.last_name || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded" // Dark mode styles
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label> {/* Changed text color */}
            <input
              id="email"
              name="email"
              value={profile.email || ''}
              disabled
              className="w-full mt-1 p-2 border border-gray-600 bg-gray-600 text-gray-400 rounded cursor-not-allowed" // Dark mode styles for disabled
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone</label> {/* Changed text color */}
            <input
              id="phone"
              name="phone"
              value={profile.phone || ''}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded" // Dark mode styles
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300">Address</label> {/* Changed text color */}
            <input
              id="address"
              name="address"
              value={profile.address || ''}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded" // Dark mode styles
            />
          </div>

          {/* City, State, ZIP Code in a row on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300">City</label> {/* Changed text color */}
              <input
                id="city"
                name="city"
                value={profile.city || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded" // Dark mode styles
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-300">State</label> {/* Changed text color */}
              <input
                id="state"
                name="state"
                value={profile.state || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded" // Dark mode styles
              />
            </div>
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-300">ZIP Code</label> {/* Changed text color */}
              <input
                id="zip_code"
                name="zip_code"
                value={profile.zip_code || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded" // Dark mode styles
              />
            </div>
          </div>

          <div className="pt-2"> {/* Added padding top for button spacing */}
            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition ease-in-out duration-150" // Changed button colors, added focus states
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}