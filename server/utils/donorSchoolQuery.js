// Query for a donor: which schools received my donated books?
// Usage: getSchoolsForDonor(donorId)

const DonationRecord = require('../models/Donation');
const BookAllocation = require('../models/BookAllocation');

async function getSchoolsForDonor(donorId) {
  // Find all donation records for this donor
  const donations = await DonationRecord.find({ donor: donorId });
  const donationIds = donations.map(d => d._id);

  // Find all allocations that used any of these donations
  const allocations = await BookAllocation.find({ donationsUsed: { $in: donationIds } })
    .populate('school', 'name address')
    .populate('donationDrive', 'name');

  // Map: for each allocation, which school and drive
  return allocations.map(a => ({
    school: a.school,
    donationDrive: a.donationDrive,
    booksAllocated: a.booksAllocated,
    allocationDate: a.allocationDate
  }));
}

module.exports = { getSchoolsForDonor };
