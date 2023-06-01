// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import './ML.sol';

contract MLManager {

    address public owner;

    mapping(string => ML) public MLs;
    mapping(string => uint256) private indexByVersion;

    string[] public versions;
    uint256 public numVersions = 0;

    event new_version(string version);

    constructor() {
        owner = msg.sender;
    }

    modifier _ownerOnly() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function upload(string memory ver, string memory net, string memory des) public{
        versions.push(ver);
        indexByVersion[ver] = numVersions;
        numVersions += 1;

        MLs[ver] = new ML(ver, net, des, msg.sender);
        emit new_version(ver);
    }

    function download(string memory ver) public view returns(string memory){
        return MLs[ver].network();
    }

    function remove(string memory ver) public{
        require(msg.sender == MLs[ver].uploader() || msg.sender == owner, "only owner of a model can delete it");

        numVersions--;
        delete versions[indexByVersion[ver]];
    }

    function getDescription(string memory ver) public view returns(string memory){
        return MLs[ver].description();
    }

    function getAverage(string memory ver) public view returns(uint256){
        return MLs[ver].average();
    }

    function addRating(string memory ver, uint256 rating) public{
        MLs[ver].addRating(rating);
    }

    function getNumRatings(string memory ver) public view returns(uint256) {
        return MLs[ver].numRatings();
    }
    
    function getOwnerOfAddress(string memory ver) public view returns(address) {
        return MLs[ver].uploader();
    }

}