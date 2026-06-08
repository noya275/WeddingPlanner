/**
 * Tests for EditableCell — the inline-edit component used throughout the guest list,
 * vendor table, and task list. Covers display, click-to-edit, save triggers (blur/Enter),
 * cancel (Escape), and the null-on-clear behaviour.
 */
import { vi } from 'vitest'
import { screen, fireEvent, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditableCell from '../src/components/EditableCell'

function setup(value: string, onSave = vi.fn()) {
  render(<EditableCell value={value} onSave={onSave} />)
  return { onSave }
}

test('shows value as text by default', () => {
  setup('Alice')
  expect(screen.getByText('Alice')).toBeInTheDocument()
})

test('shows placeholder when value is empty', () => {
  render(<EditableCell value={null} onSave={vi.fn()} />)
  expect(screen.getByText('—')).toBeInTheDocument()
})

test('switches to input on click', async () => {
  setup('Alice')
  await userEvent.click(screen.getByText('Alice'))
  expect(screen.getByRole('textbox')).toHaveValue('Alice')
})

test('calls onSave with new value on blur', async () => {
  const onSave = vi.fn()
  setup('Alice', onSave)
  await userEvent.click(screen.getByText('Alice'))
  await userEvent.clear(screen.getByRole('textbox'))
  await userEvent.type(screen.getByRole('textbox'), 'Bob')
  fireEvent.blur(screen.getByRole('textbox'))
  expect(onSave).toHaveBeenCalledWith('Bob')
})

test('calls onSave with new value on Enter', async () => {
  const onSave = vi.fn()
  setup('Alice', onSave)
  await userEvent.click(screen.getByText('Alice'))
  await userEvent.clear(screen.getByRole('textbox'))
  await userEvent.type(screen.getByRole('textbox'), 'Bob{Enter}')
  expect(onSave).toHaveBeenCalledWith('Bob')
})

test('does not call onSave if value unchanged', async () => {
  const onSave = vi.fn()
  setup('Alice', onSave)
  await userEvent.click(screen.getByText('Alice'))
  fireEvent.blur(screen.getByRole('textbox'))
  expect(onSave).not.toHaveBeenCalled()
})

test('cancels edit on Escape and restores original value', async () => {
  setup('Alice')
  await userEvent.click(screen.getByText('Alice'))
  await userEvent.clear(screen.getByRole('textbox'))
  await userEvent.type(screen.getByRole('textbox'), 'Bob')
  await userEvent.keyboard('{Escape}')
  expect(screen.getByText('Alice')).toBeInTheDocument()
})

test('calls onSave with null when cleared', async () => {
  const onSave = vi.fn()
  setup('Alice', onSave)
  await userEvent.click(screen.getByText('Alice'))
  await userEvent.clear(screen.getByRole('textbox'))
  fireEvent.blur(screen.getByRole('textbox'))
  expect(onSave).toHaveBeenCalledWith(null)
})
