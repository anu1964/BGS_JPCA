from web3 import Web3
import json, os

_INFO_PATH = os.path.join(os.path.dirname(__file__), "contract_info.json")

def _connect():
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    if not w3.is_connected():
        raise RuntimeError("Hardhat node not running on port 8545")
    with open(_INFO_PATH) as f:
        info = json.load(f)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(info["address"]),
        abi=info["abi"]
    )
    account = w3.eth.accounts[0]
    return w3, contract, account


def register_on_chain(user_id, name, phone, region):
    w3, c, acc = _connect()
    tx = c.functions.registerIdentity(user_id, name, phone, region).transact({"from": acc})
    receipt = w3.eth.wait_for_transaction_receipt(tx)
    return receipt.transactionHash.hex()


def get_identity(user_id):
    _, c, _ = _connect()
    r = c.functions.getIdentity(user_id).call()
    keys = [
        "userId", "name", "phone", "region",
        "isRegistered", "registeredAt", "accessCount",
        "isFlagged", "lastAccessTime", "loginCount"
    ]
    return dict(zip(keys, r))


def is_registered(user_id):
    _, c, _ = _connect()
    return c.functions.isRegistered(user_id).call()


def flag_user(user_id):
    w3, c, acc = _connect()
    tx = c.functions.flagIdentity(user_id).transact({"from": acc})
    w3.eth.wait_for_transaction_receipt(tx)


def record_access(user_id):
    w3, c, acc = _connect()
    tx = c.functions.recordAccess(user_id).transact({"from": acc})
    w3.eth.wait_for_transaction_receipt(tx)


def chain_status():
    w3, c, _ = _connect()
    return {
        "connected":        w3.is_connected(),
        "block_number":     w3.eth.block_number,
        "contract_address": c.address,
        "user_count":       c.functions.getUserCount().call(),
    }