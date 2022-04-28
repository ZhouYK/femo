import React, { FC } from 'react';
import { InjectProps } from '../../../index';
import { useIndividualModel, Inject } from '../../../src';

interface Props extends InjectProps {
  a: number;
  b: number;
}

const Child: FC<Props> = (props) => {
  const { a, b, suspenseKeys } = props;
  const getList = (s: number) => {
    if (b === a) return s;
    return new Promise<number>((resolve) => {
      setTimeout(() => {
        resolve(s + 1)
      }, 3000);
    })
  }

  const [r] = useIndividualModel(0, getList, [a, b], {
    suspense: {
      key: suspenseKeys[0],
      persist: true,
    }
  })

  return (
    <>
      拉取数据:{r}
    </>
  )

}

export default Inject(Child)(1);
