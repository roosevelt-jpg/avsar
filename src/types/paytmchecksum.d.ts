declare module 'paytmchecksum' {
  const PaytmChecksum: {
    generateSignature(body: string | Record<string, unknown>, key: string): Promise<string>;
    verifySignature(body: string | Record<string, unknown>, key: string, checksum: string): Promise<boolean>;
  };
  export default PaytmChecksum;
}
