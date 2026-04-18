// @ts-nocheck
import React, { useState } from 'react';
import { boardAPI } from '../utils/api';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

const AddBoard = ({ riderId, city, onSuccess }) => {
  const [formData, setFormData] = useState({
    photo_url: '',
    owner_phone: '',
    address: '',
    rent_expected: '',
    property_type: '2BHK',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await boardAPI.createBoard({
        ...formData,
        rider_id: riderId,
        city: city,
        rent_expected: parseFloat(formData.rent_expected),
      });
      toast.success('To-Let board added successfully!');
      setFormData({
        photo_url: '',
        owner_phone: '',
        address: '',
        rent_expected: '',
        property_type: '2BHK',
      });
      onSuccess();
    } catch (error) {
      toast.error('Failed to add board');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Barlow Condensed' }}>
          ADD TO-LET BOARD
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Photo URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              data-testid="photo-url-input"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="input-field"
              required
            />
            <button type="button" className="btn-secondary">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Owner Phone Number
          </label>
          <input
            type="tel"
            data-testid="owner-phone-input"
            value={formData.owner_phone}
            onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
            placeholder="Enter phone number"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Property Address
          </label>
          <textarea
            data-testid="address-input"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter full address"
            className="input-field"
            rows="3"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Expected Rent (₹)
            </label>
            <input
              type="number"
              data-testid="rent-input"
              value={formData.rent_expected}
              onChange={(e) => setFormData({ ...formData, rent_expected: e.target.value })}
              placeholder="25000"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Property Type
            </label>
            <select
              data-testid="property-type-select"
              value={formData.property_type}
              onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              className="input-field"
            >
              <option value="1BHK">1BHK</option>
              <option value="2BHK">2BHK</option>
              <option value="3BHK">3BHK</option>
              <option value="4BHK">4BHK</option>
              <option value="Villa">Villa</option>
              <option value="PG">PG</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          data-testid="submit-board-button"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Adding...' : 'Add Board'}
        </button>
      </form>
    </div>
  );
};

export default AddBoard;