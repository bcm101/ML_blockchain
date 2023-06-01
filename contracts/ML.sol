// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract ML {
    address public uploader;

    string public network;
    string public description;
    string public version;

    uint256[] public ratings;
    uint256 public numRatings;
    uint256 public average;

    uint256 public highestRating;

    constructor (string memory ver, string memory net, string memory des, address sender) {
        network = net;
        version = ver;
        description = des;

        uploader = sender;

        highestRating = 5;

    }

    function addRating(uint rating) public {
        require (rating <= highestRating && rating >= 1, "rating not in range");

        ratings.push(rating * 1000);
        
        average = (average * numRatings + rating * 1000) / (numRatings + 1);
        numRatings++;
    }

}

