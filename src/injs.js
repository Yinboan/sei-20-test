import { getQueryClient } from "@sei-js/core";
import { getNetworkInfo, Network } from "@injectivelabs/networks";
import {
  MsgSend,
  PrivateKey,
  TxClient,
  TxGrpcClient,
  ChainRestAuthApi,
  createTransaction,
} from "@injectivelabs/sdk-ts";
import { BigNumberInBase } from "@injectivelabs/utils";
import { sleep, startLog } from "./utils";

const network = getNetworkInfo(Network.Mainnet);


// 单次铸造
const mint = async (privateKey,accountIndex,index) => {
  try {
    // ======开始铸造======
    const injectiveAddress = privateKey.toBech32();
    const amount = {
      amount: new BigNumberInBase(0.03).toWei().toFixed(),
      denom: "inj",
    };
    const publicKey = privateKey.toPublicKey().toBase64();
    const accountDetails = await new ChainRestAuthApi(
      network.rest
    ).fetchAccount(injectiveAddress);
    const msg = MsgSend.fromJSON({
      amount,
      srcInjectiveAddress: injectiveAddress,
      dstInjectiveAddress: "inj15jy9vzmyy63ql9y6dvned2kdat2994x5f4ldu4",
    });
    const { signBytes, txRaw } = createTransaction({
      message: msg,
      memo: btoa(
        `data:,{"p":"injrc-20","op":"mint","tick":"INJS","amt":"2000"}`
      ),
      fee: {
        amount: [
          {
            amount: "2000000000000000",
            denom: "inj",
          },
        ],
        gas: "400000",
      },
      pubKey: publicKey,
      sequence: parseInt(accountDetails.account.base_account.sequence, 10),
      accountNumber: parseInt(
        accountDetails.account.base_account.account_number,
        10
      ),
      chainId: network.chainId,
    });
    const signature = await privateKey.sign(Buffer.from(signBytes));
    // 转账后续操作
    /** Append Signatures */
    txRaw.signatures = [signature];
    console.log(`账户${accountIndex+1} 第${index+1}次mint ${TxClient.hash(txRaw)}`);
    const txService = new TxGrpcClient(network.grpc);
    /** Simulate transaction */
    const simulationResponse = await txService.simulate(txRaw);
    /** Broadcast transaction */
    const txResponse = await txService.broadcast(txRaw);

    console.log('其他信息',{
      simulation_response:JSON.stringify(
        simulationResponse.gasInfo,
        txResponse
      )
    });
  } catch (error) {
    console.log(`账户${accountIndex} 第${index}次mint失败`);
  }
  finally{
    // 防止频率过快
    await sleep(300)
  }
};

export const main = async (mnemonic, accountIndex) => {
  const denom = "inj";
  // 解析助记词
  const priv = PrivateKey.fromMnemonic(mnemonic);
  // 账户地址
  const address = priv.toAddress();
  // 连接rpc节点
  const queryClient = await getQueryClient(
    "https://sentry.lcd.injective.network:443"
  );
  // 读取余额
  const { balance = "未知" } = await queryClient.cosmos.bank.v1beta1.balance({
    address: address.address,
    denom,
  });
  if (Number(balance.amount) === 0) {
    console.log(`账户余额不足`);
  }
  // log
  startLog({ accountIndex, address: address.address, balance });

  // 每个账户mint100w次
  for (let i = 0; i < 100*10000; i++) {
    mint(priv,accountIndex,i)
    
  }
};


(()=>{
  const list =  mnemonicList || []
  list.forEach((mnemonic,index) => {
    main(mnemonic,index)   
  });
})()