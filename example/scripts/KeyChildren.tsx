import React, {FC, PropsWithChildren} from 'react';

interface Props {

}

const KeyChildren: FC<Props> = (props: PropsWithChildren<Props>) => {
  console.log('children个数：', React.Children.count(props.children));
  return (
    <>
      {props.children}
    </>
  )
}

export default KeyChildren;
