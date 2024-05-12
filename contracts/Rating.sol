// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Rating {
    string public version;
    uint256 public numRatings;
    uint256 public averageRating;
    uint256 public rating;
    bytes32 public ID;

    constructor (
        string memory _version,
        bytes32 _ID,
        uint256 _numRatings, 
        uint256 _rating,
        uint256 _averageRating){
        
        require(_averageRating <= 5000 && _averageRating >= 0, "average rating must be between 0 to 5000");
        require(_rating <= 5 && _rating >= 1, " rating must be between 0 to 5");

        averageRating = (_averageRating * _numRatings + _rating * 1000) / (_numRatings+1);
        numRatings = _numRatings+1;
        rating = _rating;
        ID =  _ID;
        version = _version;
    }

    function getRatingInfo() public view returns(uint256, uint256){
        return (numRatings, averageRating);
    }

}

