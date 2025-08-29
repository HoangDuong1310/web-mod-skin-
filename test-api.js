const test = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/cmewhi3dc000g7xzknueo13xv/download', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        downloadUrl: 'https://example.com/download/mod-skin.zip',
        filename: 'mod-skin.zip', 
        fileSize: '2.5MB',
        version: '1.0.0'
      })
    })
    
    const data = await response.text()
    console.log('Status:', response.status)
    console.log('Response:', data)
  } catch (error) {
    console.error('Error:', error)
  }
}

test()
