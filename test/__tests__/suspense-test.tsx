import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SuspenseTest from '../components/SuspenseTest';

const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

describe('suspense test', () => {
  test('normal test', async () => {
    render(<SuspenseTest />);
    expect(screen.queryByText('加载中')).toBeNull();
    expect(screen.getByText('拉取数据:0'));
    fireEvent.click(screen.getByText('发起请求'));
    expect(screen.getByText('加载中'));
  })
})
