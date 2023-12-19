export const sleep = (time=1000)=>new Promise((res,rej)=>{
  setTimeout(()=>res(time),time)
})
export const  startLog = ({accountIndex,address,balance})=>{
  console.log(`导入第${accountIndex+1}个账号 余额：${balance} 地址：${address}`);
}