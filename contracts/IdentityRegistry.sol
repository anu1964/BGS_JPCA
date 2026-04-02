// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract IdentityRegistry {

    struct UserIdentity {
        string  userId;
        string  name;
        string  phone;
        string  region;
        bool    isRegistered;
        uint256 registeredAt;
        uint256 accessCount;
        bool    isFlagged;
        uint256 lastAccessTime;
        uint256 loginCount;
    }

    mapping(string => UserIdentity) private identities;
    string[] public userIds;

    event IdentityRegistered(string userId, string name, uint256 timestamp);
    event IdentityFlagged(string userId, uint256 timestamp);
    event AccessRecorded(string userId, uint256 newCount, uint256 timestamp);

    function registerIdentity(
        string memory userId,
        string memory name,
        string memory phone,
        string memory region
    ) public {
        require(!identities[userId].isRegistered, "Already registered");
        identities[userId] = UserIdentity({
            userId:         userId,
            name:           name,
            phone:          phone,
            region:         region,
            isRegistered:   true,
            registeredAt:   block.timestamp,
            accessCount:    0,
            isFlagged:      false,
            lastAccessTime: 0,
            loginCount:     0
        });
        userIds.push(userId);
        emit IdentityRegistered(userId, name, block.timestamp);
    }

    function getIdentity(string memory userId) public view returns (
        string memory, string memory, string memory, string memory,
        bool, uint256, uint256, bool, uint256, uint256
    ) {
        UserIdentity memory u = identities[userId];
        return (
            u.userId, u.name, u.phone, u.region,
            u.isRegistered, u.registeredAt, u.accessCount,
            u.isFlagged, u.lastAccessTime, u.loginCount
        );
    }

    function isRegistered(string memory userId) public view returns (bool) {
        return identities[userId].isRegistered;
    }

    function flagIdentity(string memory userId) public {
        require(identities[userId].isRegistered, "User not found");
        identities[userId].isFlagged = true;
        emit IdentityFlagged(userId, block.timestamp);
    }

    function unflagIdentity(string memory userId) public {
        require(identities[userId].isRegistered, "User not found");
        identities[userId].isFlagged = false;
    }

    function recordAccess(string memory userId) public {
        require(identities[userId].isRegistered, "User not found");
        identities[userId].accessCount    += 1;
        identities[userId].loginCount     += 1;
        identities[userId].lastAccessTime  = block.timestamp;
        emit AccessRecorded(userId, identities[userId].accessCount, block.timestamp);
    }

    function getUserCount() public view returns (uint256) {
        return userIds.length;
    }
}