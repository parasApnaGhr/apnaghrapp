// SEO Internal Links Component
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Home, Building } from 'lucide-react';

const SEOInternalLinks = ({ links, title = "Related Searches", nearbyLocations = [] }) => {
  return (
    <section className="py-8 border-t border-gray-200">
      {/* Related Searches */}
      {links && links.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-[#04473C]" />
            {title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {links.map((link, index) => (
              <Link
                key={index}
                to={link.url}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-[#04473C] hover:text-white transition-colors group"
              >
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                <span className="text-sm">{link.text}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Locations */}
      {nearbyLocations && nearbyLocations.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#04473C]" />
            Properties in Nearby Cities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {nearbyLocations.map((city, index) => (
              <Link
                key={index}
                to={`/rent/flats-in-${city.slug}`}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-[#04473C] hover:shadow-md transition-all text-center"
              >
                <Building className="w-6 h-6 text-[#04473C] mx-auto mb-2" />
                <span className="font-medium text-gray-900">{city.name}</span>
                <p className="text-xs text-gray-500 mt-1">{city.state}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SEOInternalLinks;
