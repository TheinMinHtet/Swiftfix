export interface IStartPay {
  prepayId: string;
  orderInfo: string;
  sign: string;
  signType: string;
  useMiniResultFlag?: boolean;
}
