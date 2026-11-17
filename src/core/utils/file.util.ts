import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
// import fse from 'fs-extra'

class FileUtil {

  // ✅ Write a JSON file
  async writeJsonFile(
    dirPath: string,
    fileName: string,
    jsonData: unknown
  ): Promise<void> {
    try {
      await this.createFolder(dirPath)
      const filePath = path.join(dirPath, `${fileName}.json`)
      await fsPromises.writeFile(
        filePath,
        JSON.stringify(jsonData, null, 2),
        'utf-8'
      )
    } catch (err) {
      console.error('[FileUtil] Write JSON failed:', err)
    }
  }

  // ✅ Delete a folder recursively
  async deleteFolder(dirPath: string): Promise<void> {
    try {
      if (fs.existsSync(dirPath)) {
        await fsPromises.rm(dirPath, { recursive: true, force: true })
        console.log(`Deleted folder: ${dirPath}`)
      }
    } catch (err) {
      console.error(`[FileUtil] Delete folder failed: ${dirPath}`, err)
    }
  }

  // ✅ Create the folder when missing
  async createFolder(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        await fsPromises.mkdir(dirPath, { recursive: true })
        console.log(`Created folder: ${dirPath}`)
      }
    } catch (err) {
      console.error(`[FileUtil] Create folder failed: ${dirPath}`, err)
    }
  }

  // ✅ Copy a folder or a file
  async copyFolder(srcDir: string, destDir: string): Promise<void> {
    try {
      if (!fs.existsSync(srcDir)) {
        console.warn(`[FileUtil] Source not found: ${srcDir}`)
        return
      }
      // await fse.copy(srcDir, destDir, { overwrite: true })
      // console.log(`Copied from ${srcDir} → ${destDir}`)
    } catch (err) {
      console.error('[FileUtil] Copy failed:', err)
    }
  }

  // ✅ Check that a report exists
  async isReportDirExisted(
    dirPath: string = './allure-report'
  ): Promise<boolean> {
    return fs.existsSync(dirPath)
  }
}

export default new FileUtil()