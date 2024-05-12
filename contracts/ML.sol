// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract ML {
    address public uploader;

    string public network;
    string public description;
    string public version;



    constructor (string memory ver, string memory net, string memory des, address sender) {
        network = net;
        version = ver;
        description = des;

        uploader = sender;

    }

    function getInfo() public view returns(string memory, string memory, address){
        return (version, description, uploader);
    }

}

