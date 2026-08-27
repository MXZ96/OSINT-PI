import React, { useState } from 'react';
import { Search, Mail, User, Phone, MapPin, Contact } from 'lucide-react';

function InputSection({ isDark, onAnalyze }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phone: '',
    fullName: '',
    location: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.email || formData.username || formData.phone || formData.fullName) {
      onAnalyze(formData);
    }
  };

  const inputClasses = `w-full px-4 py-3 rounded-lg border-2 transition-all ${
    isDark
      ? 'bg-cyberdark-800 border-cyberdark-700 text-white placeholder-gray-500 focus:border-cyberblue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  }`;

  return (
    <section className="mb-12 animate-slide-in">
      <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
        <h2 className="text-2xl font-bold mb-6">
          <span className="gradient-text">Intelligence Query</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Email Input */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Mail className="inline-block mr-2 size-4" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
                className={inputClasses}
              />
            </div>

            {/* Username Input */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <User className="inline-block mr-2 size-4" />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="github_username"
                className={inputClasses}
              />
            </div>

            {/* Phone Input */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className="inline-block mr-2 size-4" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Additional Identity Fields */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Full Name Input */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Contact className="inline-block mr-2 size-4" />
                Full Name (for correlation)
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={inputClasses}
              />
            </div>

            {/* Location Input */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <MapPin className="inline-block mr-2 size-4" />
                Location (for correlation)
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="San Francisco, CA"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-6 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 btn-primary text-white"
          >
            <Search className="size-5" />
            Analyze & Gather Intelligence
          </button>
        </form>

        <p className={`text-sm mt-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          ⚠️ This tool uses public data only. All searches are logged for security purposes.
        </p>
      </div>
    </section>
  );
}

export default InputSection;
