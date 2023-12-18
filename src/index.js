import {
  restoreWallet,
  getSigningCosmWasmClient,
  getQueryClient,
} from "@sei-js/core";
import { calculateFee } from "@cosmjs/stargate";
import {mnemonicList} from './sercret.js'
const RPC_URL = "https://sei-rpc.polkachu.com/";
const REST_URL = "https://sei-api.polkachu.com/";
const NETWORK = "pacific-1";

const generateWalletFromMnemonic = async (m) => {
  const wallet = await restoreWallet(m, 0);
  return wallet;
};

// 余额查询
const querySeiBalance = async (address) => {
  const queryClient = await getQueryClient(REST_URL);
  const result = await queryClient.cosmos.bank.v1beta1.balance({
    address: address,
    denom: "usei",
  });
  return result.balance;
};

async function main(mnemonic,index) {
  // 解析助记词
  const wallet = await generateWalletFromMnemonic(mnemonic);
  const accounts = await wallet.getAccounts();
  console.log("连接账户", accounts[0].address);
  const balance = await querySeiBalance(accounts[0].address);
  console.log("账户余额", balance);
  const msg = {
    p: "sei-20",
    op: "mint",
    tick: "seis",
    amt: "1000",
  };
  const msg_base64 = btoa(`data:,${JSON.stringify(msg)}`);
  const fee = calculateFee(100000, "0.1usei");

  // 链接rpc节点
  const signingCosmWasmClient = await getSigningCosmWasmClient(RPC_URL, wallet);

  for (let i = 0; i < 5000000; i++) {
    try {
      const response = await signingCosmWasmClient.sendTokens(
        accounts[0].address,
        accounts[0].address,
        [{ amount: "1", denom: "usei" }],
        fee,
        msg_base64
      );
      console.log(`账户${index+1} 第${i+1}次mint： ${response.transactionHash}`);
    } catch (error) {
      console.log(`第${i+1}次mint失败`, error);
    }
  }
}

(()=>{
  const list =  mnemonicList || []
  list.forEach((mnemonic,index) => {
    main(mnemonic,index)   
  });
})()