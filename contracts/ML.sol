// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract ML {

    address public owner;

    mapping(string => string) public networks;
    mapping(string => string) public descriptions;

    string[] public versions; 
    uint256 public numVersions;

    event new_version(string version);

    constructor() {
        owner = msg.sender;
    }

    modifier _ownerOnly() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function upload(string memory ver, string memory net, string memory des) _ownerOnly public {
        versions.push(ver);
        networks[ver] = net;
        descriptions[ver] = des;
        numVersions += 1;

        emit new_version(ver);
    }

    function download(string memory ver) public view returns(string memory network)  {
        return networks[ver];
    }

}