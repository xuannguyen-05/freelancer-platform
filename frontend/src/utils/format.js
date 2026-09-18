export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export const formatDate = (date, format = 'MMM D, YYYY') => {
  const dayjs = require('dayjs')
  return dayjs(date).format(format)
}

export const formatRelativeTime = (date) => {
  const dayjs = require('dayjs')
  const relativeTime = require('dayjs/plugin/relativeTime')
  dayjs.extend(relativeTime)
  return dayjs(date).fromNow()
}

export const formatNumber = (number, locale = 'en-US') => {
  return new Intl.NumberFormat(locale).format(number)
}

export const formatPercent = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`
}
