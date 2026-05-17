import { FiFilter, FiMapPin, FiSearch } from 'react-icons/fi'

function SearchStrip() {
  return (
    <div className="search-strip">
      <div className="search-input">
        <FiSearch />
        <input placeholder="Search localities, BHK, builder..." />
      </div>
      <button className="icon-btn">
        <FiMapPin />
      </button>
      <button className="secondary compact">
        <FiFilter /> Filters
      </button>
      <button className="secondary compact desktop-only">
        <FiFilter /> Advanced filters
      </button>
    </div>
  )
}

export default SearchStrip
