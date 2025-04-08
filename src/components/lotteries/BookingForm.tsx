'use client';

// File path: src/components/lotteries/BookingForm.tsx
import { useState } from 'react';

interface BookingFormProps {
  lotteryType: string;
  onSubmit: (formData: BookingFormData) => void;
  onCancel: () => void;
  drawTimePassed?: boolean;
}

export interface BookingFormData {
  name: string;
  phoneNumber: string;
  gameId: string;
  serverId: string;
  ingameName: string;
  [key: string]: string;
}

export default function BookingForm({ 
  lotteryType, 
  onSubmit, 
  onCancel,
  drawTimePassed = false
}: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    phoneNumber: '',
    gameId: '',
    serverId: '',
    ingameName: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when changing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    // Game-specific validations
    if (lotteryType === 'game') {
      if (!formData.gameId.trim()) {
        newErrors.gameId = 'Game ID is required';
      }
      
      if (!formData.serverId.trim()) {
        newErrors.serverId = 'Server ID is required';
      }
      
      if (!formData.ingameName.trim()) {
        newErrors.ingameName = 'In-game name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Show notice when draw time has passed */}
      {drawTimePassed && (
        <div className="bg-alert/10 p-3 rounded text-sm text-alert mb-3">
          Note: The scheduled draw time has passed, but you can still book this ticket.
        </div>
      )}
      
      {/* Common fields for all lottery types */}
      <div className="form-group">
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full bg-neutral-dark/50 border ${
            errors.name ? 'border-accent' : 'border-neutral-light/20'
          } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-secondary`}
          placeholder="Your name"
        />
        {errors.name && (
          <p className="text-accent text-xs mt-1">{errors.name}</p>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className={`w-full bg-neutral-dark/50 border ${
            errors.phoneNumber ? 'border-accent' : 'border-neutral-light/20'
          } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-secondary`}
          placeholder="Your phone number"
        />
        {errors.phoneNumber && (
          <p className="text-accent text-xs mt-1">{errors.phoneNumber}</p>
        )}
      </div>
      
      {/* Additional fields for game lotteries */}
      {lotteryType === 'game' && (
        <>
          <div className="form-group">
            <label htmlFor="ingameName" className="block text-sm font-medium mb-1">
              In-game Name
            </label>
            <input
              type="text"
              id="ingameName"
              name="ingameName"
              value={formData.ingameName}
              onChange={handleChange}
              className={`w-full bg-neutral-dark/50 border ${
                errors.ingameName ? 'border-accent' : 'border-neutral-light/20'
              } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-secondary`}
              placeholder="Your in-game name"
            />
            {errors.ingameName && (
              <p className="text-accent text-xs mt-1">{errors.ingameName}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="gameId" className="block text-sm font-medium mb-1">
              Game ID
            </label>
            <input
              type="text"
              id="gameId"
              name="gameId"
              value={formData.gameId}
              onChange={handleChange}
              className={`w-full bg-neutral-dark/50 border ${
                errors.gameId ? 'border-accent' : 'border-neutral-light/20'
              } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-secondary`}
              placeholder="Your game ID"
            />
            {errors.gameId && (
              <p className="text-accent text-xs mt-1">{errors.gameId}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="serverId" className="block text-sm font-medium mb-1">
              Server
            </label>
            <input
              type="text"
              id="serverId"
              name="serverId"
              value={formData.serverId}
              onChange={handleChange}
              className={`w-full bg-neutral-dark/50 border ${
                errors.serverId ? 'border-accent' : 'border-neutral-light/20'
              } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-secondary`}
              placeholder="Your server"
            />
            {errors.serverId && (
              <p className="text-accent text-xs mt-1">{errors.serverId}</p>
            )}
          </div>
        </>
      )}
      
      <div className="flex space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-neutral-light/10 hover:bg-neutral-light/20 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
        >
          Book Ticket
        </button>
      </div>
    </form>
  );
}