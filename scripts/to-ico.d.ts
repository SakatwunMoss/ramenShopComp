declare module "to-ico" {
  export default function toIco(
    input: Buffer | Buffer[],
    options?: { resize?: boolean; sizes?: number[] },
  ): Promise<Buffer>;
}
