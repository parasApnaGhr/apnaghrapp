import React, { useState } from 'react';
import { brokerAPI } from '../utils/api';
import { Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BrokerVisits = ({ riderId, city, onSuccess }) => {
  const [formData, setFormData] = useState({
    broker_name: '',
    office_location: '',
    phone_number: '',
    interest_level: 'medium',
    package_sold: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await brokerAPI.createBrokerVisit({
        ...formData,
        rider_id: riderId,
        city: city,
      });
      toast.success('Broker visit logged successfully!');
      setFormData({
        broker_name: '',
        office_location: '',
        phone_number: '',
        interest_level: 'medium',
        package_sold: false,
      });
      onSuccess();
    } catch (error) {
      toast.error('Failed to log broker visit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Barlow Condensed' }}>
          LOG BROKER VISIT
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Broker Name
          </label>
          <input
            type="text"
            data-testid="broker-name-input"
            value={formData.broker_name}
            onChange={(e) => setFormData({ ...formData, broker_name: e.target.value })}
            placeholder="Enter broker name"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Office Location
          </label>
          <input
            type="text"
            data-testid="office-location-input"
            value={formData.office_location}
            onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
            placeholder="Enter office address"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Phone Number
          </label>
          <input
            type="tel"
            data-testid="broker-phone-input"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            placeholder="Enter phone number"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Interest Level
          </label>
          <select
            data-testid="interest-level-select"
            value={formData.interest_level}
            onChange={(e) => setFormData({ ...formData, interest_level: e.target.value })}
            className="input-field"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            data-testid="package-sold-checkbox"
            checked={formData.package_sold}
            onChange={(e) => setFormData({ ...formData, package_sold: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label className="text-sm font-medium text-slate-700">
            Package Sold
          </label>
        </div>

        <button
          type="submit"
          data-testid="submit-broker-visit-button"
          disabled={submitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {submitting ? 'Logging...' : 'Log Visit'}
        </button>
      </form>
    </div>
  );
};

export default BrokerVisits;