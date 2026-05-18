import * as XLSX from 'xlsx'

/**
 * 解析上传的Excel/CSV文件
 * @param {File} file - 文件对象
 * @returns {Promise<{headers: string[], data: object[]}>}
 */
export async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const fileData = new Uint8Array(e.target.result)
        const workbook = XLSX.read(fileData, { type: 'array', cellDates: true })

        // 读取第一个工作表
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // 转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
          throw new Error('文件数据不足，需要包含表头和至少一行数据')
        }

        // 第一行是表头
        const headers = jsonData[0].map(h => String(h || '').trim())

        // 后续是数据行
        const dataRows = jsonData.slice(1).filter(row =>
          row.some(cell => cell !== null && cell !== undefined && cell !== '')
        )

        // 转换为对象数组
        const products = dataRows.map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            let value = row[index]
            if (value instanceof Date) {
              value = value.toLocaleDateString('zh-CN')
            }
            // 处理Excel中可能的多余空格
            const cleanHeader = String(header).trim()
            obj[cleanHeader] = value ?? ''
          })
          return obj
        })

        resolve({ headers, products })
      } catch (error) {
        reject(new Error(`文件解析失败: ${error.message}`))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 将产品数据格式化为文本
 */
export function formatProductData(data) {
  return data.map((row, index) => {
    const lines = Object.entries(row)
      .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
    return `【产品${index + 1}】\n${lines}`
  }).join('\n\n')
}