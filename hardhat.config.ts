import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

let PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
if (PRIVATE_KEY && !PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = "0x" + PRIVATE_KEY;
}
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        baseSepolia: {
            url: BASE_SEPOLIA_RPC,
            accounts: [PRIVATE_KEY],
            chainId: 84532,
        },
        baseMainnet: {
            url: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
            accounts: [PRIVATE_KEY],
            chainId: 8453,
        },
    },
    etherscan: {
        apiKey: BASESCAN_API_KEY,
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
