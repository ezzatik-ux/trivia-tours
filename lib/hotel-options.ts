// Controlled vocabulary for hotel facilities + room amenities.
// Edit here to extend the lists app-wide.

export const HOTEL_FACILITIES: { group: string; items: string[] }[] = [
  { group: "General", items: ["Free WiFi", "24h Front Desk", "Airport Shuttle", "Parking", "Elevator", "Currency Exchange", "Non-smoking Rooms", "Family Rooms"] },
  { group: "Wellness", items: ["Outdoor Pool", "Indoor Pool", "Spa", "Sauna", "Fitness Centre", "Hammam", "Massage"] },
  { group: "Food & Drink", items: ["Restaurant", "Bar", "Room Service", "Breakfast Available", "Beach Bar", "Cafe"] },
  { group: "Beach & Leisure", items: ["Private Beach", "Beach Access", "Water Sports", "Kids Club", "Entertainment", "Garden", "Shared Terrace"] },
  { group: "Services", items: ["Laundry", "Business Centre", "Meeting Rooms", "Concierge", "Car Rental", "Tour Desk"] },
  { group: "Accessibility", items: ["Wheelchair Accessible", "Accessible Bathroom"] },
];

export const ROOM_AMENITIES: { group: string; items: string[] }[] = [
  { group: "Comfort", items: ["Air Conditioning", "Heating", "Soundproofing", "Balcony", "Private Terrace", "Connecting Rooms"] },
  { group: "Bathroom", items: ["Private Bathroom", "Bathtub", "Shower", "Hairdryer", "Bathrobes", "Free Toiletries", "Slippers"] },
  { group: "Tech & Extras", items: ["Flat-screen TV", "Safe", "Minibar", "Coffee/Tea Maker", "Telephone", "Iron", "Desk"] },
  { group: "View", items: ["Sea View", "Pool View", "Garden View", "City View", "Mountain View", "Landmark View"] },
];
