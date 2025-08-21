import { db } from "./server/db";
import { networks, protocols, tokens } from "./shared/schema";

async function seedNewTables() {
  try {
    console.log("🌱 Seeding new tables with sample data...");
    
    // Insert sample networks
    const [ethNetwork, baseNetwork] = await db.insert(networks)
      .values([
        {
          chainId: "1",
          name: "ethereum",
          displayName: "Ethereum",
          nativeToken: "ETH",
          logoUrl: "/logos/ethereum.svg",
          website: "https://ethereum.org",
          twitter: "https://twitter.com/ethereum",
          discord: "https://discord.gg/ethereum",
          github: "https://github.com/ethereum",
          docs: "https://ethereum.org/developers",
          explorer: "https://etherscan.io",
          rpcUrl: "https://mainnet.infura.io/v3/",
          color: "#627EEA",
          isActive: true,
          isTestnet: false,
        },
        {
          chainId: "8453",
          name: "base",
          displayName: "Base",
          nativeToken: "ETH",
          logoUrl: "/logos/base.svg",
          website: "https://base.org",
          twitter: "https://twitter.com/base",
          discord: "https://discord.gg/base",
          github: "https://github.com/base-org",
          docs: "https://docs.base.org",
          explorer: "https://basescan.org",
          rpcUrl: "https://mainnet.base.org",
          color: "#0052FF",
          isActive: true,
          isTestnet: false,
        }
      ])
      .returning();
    console.log("✅ Inserted networks:", ethNetwork.displayName, baseNetwork.displayName);

    // Insert sample protocols
    const [morphoProtocol, lidoProtocol] = await db.insert(protocols)
      .values([
        {
          protocolId: "morpho",
          name: "morpho",
          displayName: "Morpho",
          networkId: ethNetwork.id,
          chainId: ethNetwork.chainId,
          logoUrl: "/logos/morpho.svg",
          website: "https://morpho.org",
          twitter: "https://twitter.com/MorphoLabs",
          discord: "https://discord.gg/morpho",
          github: "https://github.com/morpho-org",
          docs: "https://docs.morpho.org",
          slug: "morpho",
          visitUrlTemplate: "https://app.morpho.org",
          showUnderlyingTokens: true,
          dataRefreshIntervalMinutes: 5,
          isActive: true,
        },
        {
          protocolId: "lido",
          name: "lido",
          displayName: "Lido",
          networkId: ethNetwork.id,
          chainId: ethNetwork.chainId,
          logoUrl: "/logos/lido.svg",
          website: "https://lido.fi",
          twitter: "https://twitter.com/LidoFinance",
          discord: "https://discord.gg/lido",
          github: "https://github.com/lidofinance",
          docs: "https://docs.lido.fi",
          slug: "lido",
          visitUrlTemplate: "https://stake.lido.fi",
          showUnderlyingTokens: false,
          dataRefreshIntervalMinutes: 10,
          isActive: true,
        }
      ])
      .returning();
    console.log("✅ Inserted protocols:", morphoProtocol.displayName, lidoProtocol.displayName);

    // Insert sample tokens
    const insertedTokens = await db.insert(tokens)
      .values([
        {
          networkId: ethNetwork.id,
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
          logoUrl: "/logos/usdc.svg",
          coingeckoId: "usd-coin",
          priceUsd: "1.00",
          priceChange24h: "0.01",
          marketCap: "50000000000",
          volume24h: "5000000000",
          totalSupply: "50000000000",
          circulatingSupply: "50000000000",
          holdersCount: 1500000,
          isVerified: true,
          isActive: true,
        },
        {
          networkId: ethNetwork.id,
          address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
          symbol: "stETH",
          name: "Lido Staked ETH",
          decimals: 18,
          logoUrl: "/logos/steth.svg",
          coingeckoId: "staked-ether",
          priceUsd: "3500.00",
          priceChange24h: "2.5",
          marketCap: "30000000000",
          volume24h: "500000000",
          totalSupply: "8500000",
          circulatingSupply: "8500000",
          holdersCount: 500000,
          isVerified: true,
          isActive: true,
        },
        {
          networkId: ethNetwork.id,
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          symbol: "WETH",
          name: "Wrapped Ether",
          decimals: 18,
          logoUrl: "/logos/weth.svg",
          coingeckoId: "weth",
          priceUsd: "3500.00",
          priceChange24h: "2.5",
          marketCap: "10000000000",
          volume24h: "2000000000",
          totalSupply: "3000000",
          circulatingSupply: "3000000",
          holdersCount: 800000,
          isVerified: true,
          isActive: true,
        },
        {
          networkId: baseNetwork.id,
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
          logoUrl: "/logos/usdc.svg",
          coingeckoId: "usd-coin",
          priceUsd: "1.00",
          priceChange24h: "0.01",
          marketCap: "500000000",
          volume24h: "50000000",
          totalSupply: "500000000",
          circulatingSupply: "500000000",
          holdersCount: 50000,
          isVerified: true,
          isActive: true,
        }
      ])
      .returning();
    console.log("✅ Inserted tokens:", insertedTokens.map(t => t.symbol).join(", "));

    console.log("✅ All sample data inserted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding tables:", error);
    process.exit(1);
  }
}

seedNewTables();