// @ts-nocheck
// SEO Property Card Component - Read-only display
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Square, Heart } from 'lucide-react';

const SEOPropertyCard = ({ property, listingType = 'rent' }) => {
  const formatPrice = (price) => {
    if (!price) return 'Price on Request';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lac`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <article 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
      itemScope 
      itemType="https://schema.org/RealEstateListing"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {property.images?.[0] || property.image ? (
          <img
            src={property.images?.[0] || property.image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            itemProp="image"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        
        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            listingType === 'rent' 
              ? 'bg-blue-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            {listingType === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>
        
        {/* Wishlist */}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="mb-2" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <span 
            className="text-xl font-bold text-[#04473C]"
            itemProp="price"
            content={property.price || property.rent}
          >
            {formatPrice(property.price || property.rent)}
          </span>
          {listingType === 'rent' && <span className="text-gray-500 text-sm">/month</span>}
          <meta itemProp="priceCurrency" content="INR" />
        </div>

        {/* Title */}
        <h3 
          className="font-semibold text-gray-900 mb-2 line-clamp-1"
          itemProp="name"
        >
          {property.title}
        </h3>

        {/* Location */}
        <div 
          className="flex items-center gap-1 text-gray-600 text-sm mb-3"
          itemProp="address"
          itemScope
          itemType="https://schema.org/PostalAddress"
        >
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1" itemProp="streetAddress">
            {property.location || property.area_name || 'Location not specified'}
          </span>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-gray-600 text-sm border-t pt-3">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <BedDouble className="w-4 h-4" />
              <span>{property.bedrooms} Bed</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms} Bath</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{property.area} sq.ft</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/property/${property.id}`}
          className="block w-full mt-4 py-2.5 bg-[#04473C] text-white text-center rounded-lg font-medium hover:bg-[#033530] transition-colors"
        >
          View Details
        </Link>
      </div>
    </article>
  );
};

export default SEOPropertyCard;
