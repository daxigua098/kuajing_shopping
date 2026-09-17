import type { Directive } from 'vue'
import type { Language } from '@/types'
import { state } from '@/store'

type Translation = [string, string]

const dictionary: Record<string, Translation> = {
  '业务总览': ['Overview', 'Gambaran'],
  '组织与档案': ['Organization & Records', 'Organisasi & Rekod'],
  '业务运营': ['Operations', 'Operasi'],
  '财务结算': ['Finance & Settlement', 'Kewangan & Penyelesaian'],
  '系统': ['System', 'Sistem'],
  '经营工作台': ['Dashboard', 'Papan Pemuka'],
  '公司管理': ['Companies', 'Pengurusan Syarikat'],
  '代理体系': ['Agent Network', 'Rangkaian Ejen'],
  '人头档案': ['People Records', 'Rekod Individu'],
  '人头提交': ['Submissions', 'Penyerahan'],
  '店铺类型': ['Shop Types', 'Jenis Kedai'],
  '店铺档案': ['Shop Records', 'Rekod Kedai'],
  '保护期': ['Protection Period', 'Tempoh Perlindungan'],
  '流量卡管理': ['Data Card Management', 'Pengurusan Kad Data'],
  '开店任务': ['Opening Tasks', 'Tugasan Pembukaan'],
  '租金与分配规则': ['Rent & Distribution Rules', 'Peraturan Sewa & Agihan'],
  '垫付杂费': ['Advanced Expenses', 'Perbelanjaan Pendahuluan'],
  '结算模式': ['Settlement Models', 'Model Penyelesaian'],
  '月度核算': ['Monthly Settlement', 'Penyelesaian Bulanan'],
  '支付与对账': ['Payments & Reconciliation', 'Pembayaran & Rekonsiliasi'],
  '报表与导出': ['Reports & Exports', 'Laporan & Eksport'],
  '操作日志': ['Audit Log', 'Log Audit'],
  '系统设置': ['System Settings', 'Tetapan Sistem'],
  '掌握店铺健康、结算进度与待办事项': ['Monitor shop health, settlement progress and tasks', 'Pantau kesihatan kedai, kemajuan penyelesaian dan tugasan'],
  '维护合作公司、编码规则与业务区域': ['Manage partner companies, code rules and regions', 'Urus syarikat rakan, peraturan kod dan wilayah'],
  '管理代理关系、团队收益与数据范围': ['Manage agent relationships, team earnings and data scope', 'Urus hubungan ejen, pendapatan pasukan dan skop data'],
  '录入实名、银行、证件图片并追踪开店状态': ['Manage identity, bank and document images', 'Urus identiti, bank dan imej dokumen'],
  '顶级代理提交公司，公司审核后安排开店': ['Top agents submit people for company review', 'Ejen utama menyerahkan individu untuk semakan syarikat'],
  '管理公司运营平台，新增店铺时选择使用': ['Manage company platforms for shop creation', 'Urus platform syarikat untuk penciptaan kedai'],
  '追踪店铺存活、归属和结算模式': ['Track shop status, ownership and settlement model', 'Jejak status, pemilikan dan model penyelesaian kedai'],
  '维护公司保护期类型，并在店铺开店时选择使用': ['Manage company protection period types', 'Urus jenis tempoh perlindungan syarikat'],
  '一店一卡，维护流量卡号、每月续费日与到期状态': ['One card per shop with renewal and expiry tracking', 'Satu kad bagi setiap kedai dengan penjejakan pembaharuan'],
  '发布、承接与追踪开店任务进度': ['Publish, claim and track opening tasks', 'Terbit, ambil dan jejak tugasan pembukaan'],
  '规则版本化，保留每个结算月份的历史快照': ['Versioned rules with monthly history', 'Peraturan berversi dengan sejarah bulanan'],
  '录入凭证、按月汇总并由公司全额报销': ['Record proofs and company reimbursements', 'Rekod bukti dan pembayaran balik syarikat'],
  '设置公司一次性或按月给与顶级代理的金额': ['Configure company payments to top agents', 'Tetapkan bayaran syarikat kepada ejen utama'],
  '店租与杂费合并核算，确认后登记支付': ['Combine rent and expenses, then register payment', 'Gabungkan sewa dan perbelanjaan, kemudian daftar bayaran'],
  '应结、实结和差异追踪': ['Track payable, paid and differences', 'Jejak patut bayar, dibayar dan perbezaan'],
  '多维查询并导出 Excel 兼容 CSV / TXT': ['Query and export CSV / TXT', 'Cari dan eksport CSV / TXT'],
  '关键业务操作完整留痕': ['Full audit trail for key operations', 'Jejak audit penuh untuk operasi penting'],
  '界面语言、视觉主题与演示数据': ['Language, themes and demo data', 'Bahasa, tema dan data demo'],
  '新增': ['Add', 'Tambah'],
  '新增店铺': ['Add Shop', 'Tambah Kedai'],
  '新增公司': ['Add Company', 'Tambah Syarikat'],
  '新增店铺类型': ['Add Shop Type', 'Tambah Jenis Kedai'],
  '新增保护期类型': ['Add Protection Period', 'Tambah Tempoh Perlindungan'],
  '新增顶级代理': ['Add Top Agent', 'Tambah Ejen Utama'],
  '新增下级': ['Add Downline', 'Tambah Ejen Bawah'],
  '新增规则版本': ['Add Rule Version', 'Tambah Versi Peraturan'],
  '新增结算模式分类': ['Add Settlement Model', 'Tambah Model Penyelesaian'],
  '新增公司结算模式分类': ['Add Company Settlement Model', 'Tambah Model Penyelesaian Syarikat'],
  '发布开店任务': ['Publish Opening Task', 'Terbit Tugasan Pembukaan'],
  '添加人头并提交': ['Add & Submit Person', 'Tambah & Serah Individu'],
  '添加/提交人头': ['Add / Submit Person', 'Tambah / Serah Individu'],
  '录入人头资料': ['Add Person Record', 'Tambah Rekod Individu'],
  '录入垫付杂费': ['Add Advanced Expense', 'Tambah Perbelanjaan Pendahuluan'],
  '保存': ['Save', 'Simpan'],
  '保存公司': ['Save Company', 'Simpan Syarikat'],
  '保存店铺': ['Save Shop', 'Simpan Kedai'],
  '保存代理': ['Save Agent', 'Simpan Ejen'],
  '保存任务': ['Save Task', 'Simpan Tugasan'],
  '保存杂费': ['Save Expense', 'Simpan Perbelanjaan'],
  '保存保护期': ['Save Protection Period', 'Simpan Tempoh Perlindungan'],
  '保存流量卡': ['Save Data Card', 'Simpan Kad Data'],
  '保存人头档案': ['Save Person Record', 'Simpan Rekod Individu'],
  '保存并提交': ['Save & Submit', 'Simpan & Serah'],
  '取消': ['Cancel', 'Batal'],
  '关闭': ['Close', 'Tutup'],
  '编辑': ['Edit', 'Edit'],
  '编辑卡片': ['Edit Card', 'Edit Kad'],
  '编辑资料': ['Edit Record', 'Edit Rekod'],
  '编辑店铺': ['Edit Shop', 'Edit Kedai'],
  '查看资料': ['View Details', 'Lihat Butiran'],
  '详情': ['Details', 'Butiran'],
  '删除': ['Delete', 'Padam'],
  '停用': ['Disable', 'Nyahaktif'],
  '启用': ['Enable', 'Aktifkan'],
  '全部': ['All', 'Semua'],
  '全部公司': ['All Companies', 'Semua Syarikat'],
  '全部状态': ['All Statuses', 'Semua Status'],
  '全部日期': ['All Dates', 'Semua Tarikh'],
  '全部模式': ['All Models', 'Semua Model'],
  '全部代理': ['All Agents', 'Semua Ejen'],
  '全部店铺类型': ['All Shop Types', 'Semua Jenis Kedai'],
  '全部审核状态': ['All Review Statuses', 'Semua Status Semakan'],
  '全部业务状态': ['All Business Statuses', 'Semua Status Perniagaan'],
  '全部卡片状态': ['All Card Statuses', 'Semua Status Kad'],
  '状态': ['Status', 'Status'],
  '操作': ['Actions', 'Tindakan'],
  '公司': ['Company', 'Syarikat'],
  '店铺': ['Shop', 'Kedai'],
  '店铺编号': ['Shop Code', 'Kod Kedai'],
  '店铺名称': ['Shop Name', 'Nama Kedai'],
  '人头': ['Person', 'Individu'],
  '人头姓名': ['Person Name', 'Nama Individu'],
  '人头名字': ['Person Name', 'Nama Individu'],
  '代理': ['Agent', 'Ejen'],
  '归属代理': ['Owner Agent', 'Ejen Pemilik'],
  '公司 / 代理': ['Company / Agent', 'Syarikat / Ejen'],
  '开店日期': ['Opening Date', 'Tarikh Dibuka'],
  '开店时间': ['Opening Date', 'Tarikh Dibuka'],
  '封店日期': ['Closing Date', 'Tarikh Ditutup'],
  '关店日期': ['Closing Date', 'Tarikh Ditutup'],
  '开户日期': ['Opening Date', 'Tarikh Dibuka'],
  '到期日期': ['Expiry Date', 'Tarikh Luput'],
  '提交时间': ['Submitted At', 'Diserah Pada'],
  '审核信息': ['Review Info', 'Maklumat Semakan'],
  '提交公司': ['Company', 'Syarikat'],
  '提交代理': ['Submitting Agent', 'Ejen Penyerah'],
  '业务状态': ['Business Status', 'Status Perniagaan'],
  '结算金额': ['Settlement Amount', 'Jumlah Penyelesaian'],
  '月租': ['Monthly Rent', 'Sewa Bulanan'],
  '店租': ['Rent', 'Sewa'],
  '杂费': ['Expenses', 'Perbelanjaan'],
  '应结金额': ['Payable Amount', 'Jumlah Patut Dibayar'],
  '应结合计': ['Total Payable', 'Jumlah Patut Dibayar'],
  '开店费': ['Opening Fee', 'Fi Pembukaan'],
  '流量卡号码': ['Data Card Number', 'Nombor Kad Data'],
  '流量卡到期续费日': ['Data Card Renewal Date', 'Tarikh Pembaharuan Kad Data'],
  '每月续费': ['Monthly Renewal', 'Pembaharuan Bulanan'],
  '费用凭证图片': ['Expense Proof Image', 'Imej Bukti Perbelanjaan'],
  '凭证状态': ['Proof Status', 'Status Bukti'],
  '店铺保护期': ['Shop Protection Period', 'Tempoh Perlindungan Kedai'],
  '保护期名称': ['Protection Period Name', 'Nama Tempoh Perlindungan'],
  '保护月数': ['Protection Months', 'Bulan Perlindungan'],
  '保护期内店': ['Protected Shops', 'Kedai Dilindungi'],
  '一次性店': ['One-time Shops', 'Kedai Sekali Bayar'],
  '计费店数': ['Billable Shops', 'Kedai Dicaj'],
  '存活周期': ['Survival Period', 'Tempoh Hidup'],
  '存活': ['Alive', 'Hidup'],
  '关店': ['Closed', 'Ditutup'],
  '已关店': ['Closed', 'Ditutup'],
  '经营中': ['Operating', 'Beroperasi'],
  '筹备中': ['Preparing', 'Persediaan'],
  '暂停': ['Paused', 'Digantung'],
  '未配置': ['Not Configured', 'Belum Dikonfigurasi'],
  '无保护期': ['No Protection Period', 'Tiada Tempoh Perlindungan'],
  '正常': ['Normal', 'Normal'],
  '即将到期': ['Due Soon', 'Akan Luput'],
  '已到期': ['Expired', 'Telah Luput'],
  '缺少续费日': ['Renewal Date Missing', 'Tarikh Pembaharuan Tiada'],
  '未上传': ['Not Uploaded', 'Belum Dimuat Naik'],
  '未设置': ['Not Set', 'Belum Ditetapkan'],
  '未封店': ['Not Closed', 'Belum Ditutup'],
  '未关店': ['Not Closed', 'Belum Ditutup'],
  '已上传': ['Uploaded', 'Telah Dimuat Naik'],
  '已上传截图': ['Screenshot Uploaded', 'Tangkapan Skrin Dimuat Naik'],
  '待公司审核': ['Pending Company Review', 'Menunggu Semakan Syarikat'],
  '待顶级代理分配': ['Pending Top Agent Assignment', 'Menunggu Agihan Ejen Utama'],
  '审核通过': ['Approved', 'Diluluskan'],
  '已通过': ['Approved', 'Diluluskan'],
  '已驳回': ['Rejected', 'Ditolak'],
  '已取消': ['Cancelled', 'Dibatalkan'],
  '待确认': ['Pending Confirmation', 'Menunggu Pengesahan'],
  '已确认': ['Confirmed', 'Disahkan'],
  '已支付': ['Paid', 'Dibayar'],
  '已结清': ['Settled', 'Selesai'],
  '待支付': ['Pending Payment', 'Menunggu Pembayaran'],
  '待审核': ['Pending Review', 'Menunggu Semakan'],
  '已开店': ['Opened', 'Telah Dibuka'],
  '未开店': ['Not Opened', 'Belum Dibuka'],
  '死店': ['Dead Shop', 'Kedai Mati'],
  '无效人头': ['Invalid Person', 'Individu Tidak Sah'],
  '搜索': ['Search', 'Cari'],
  '搜索店铺编号、名称、人头': ['Search shop code, name or person', 'Cari kod kedai, nama atau individu'],
  '搜索保护期名称或月数': ['Search protection period or months', 'Cari tempoh perlindungan atau bulan'],
  '搜索店铺、人头、卡号': ['Search shop, person or card number', 'Cari kedai, individu atau nombor kad'],
  '搜索店铺、人头、代理、用途': ['Search shop, person, agent or purpose', 'Cari kedai, individu, ejen atau tujuan'],
  '搜索人头、IC、公司或店铺类型': ['Search person, IC, company or shop type', 'Cari individu, IC, syarikat atau jenis kedai'],
  '搜索姓名、IC、银行卡、邮箱': ['Search name, IC, bank card or email', 'Cari nama, IC, kad bank atau e-mel'],
  '导出店铺表': ['Export Shop Table', 'Eksport Jadual Kedai'],
  '导出当前明细': ['Export Current Details', 'Eksport Butiran Semasa'],
  '导出批次明细': ['Export Batch Details', 'Eksport Butiran Kelompok'],
  '导出杂费表': ['Export Expense Table', 'Eksport Jadual Perbelanjaan'],
  '导出汇总报表': ['Export Summary', 'Eksport Ringkasan'],
  '导出流量卡表': ['Export Data Card Table', 'Eksport Jadual Kad Data'],
  '导出保护期': ['Export Protection Periods', 'Eksport Tempoh Perlindungan'],
  '导出 CSV': ['Export CSV', 'Eksport CSV'],
  '生成并下载': ['Generate & Download', 'Jana & Muat Turun'],
  '恢复默认': ['Restore Defaults', 'Pulihkan Lalai'],
  '全选': ['Select All', 'Pilih Semua'],
  '选择店铺导出字段': ['Select Shop Export Fields', 'Pilih Medan Eksport Kedai'],
  '选择人头导出字段': ['Select Person Export Fields', 'Pilih Medan Eksport Individu'],
  '选择月度核算导出字段': ['Select Settlement Export Fields', 'Pilih Medan Eksport Penyelesaian'],
  '选择杂费导出字段': ['Select Expense Export Fields', 'Pilih Medan Eksport Perbelanjaan'],
  '图片导出字段（可选）': ['Optional Image Fields', 'Medan Imej Pilihan'],
  '默认': ['Default', 'Lalai'],
  '图片': ['Image', 'Imej'],
  '图片可选': ['Optional Image', 'Imej Pilihan'],
  '上传图片': ['Upload Image', 'Muat Naik Imej'],
  '移除': ['Remove', 'Buang'],
  '暂无图片': ['No Image', 'Tiada Imej'],
  '点击缩略图查看原图': ['Click thumbnail to view full image', 'Klik thumbnail untuk lihat imej penuh'],
  '选填': ['Optional', 'Pilihan'],
  '必填': ['Required', 'Wajib'],
  '备注': ['Remarks', 'Catatan'],
  '无备注': ['No Remarks', 'Tiada Catatan'],
  '用户名': ['Username', 'Nama Pengguna'],
  '邮箱': ['Email', 'E-mel'],
  '联系电话': ['Phone', 'Telefon'],
  '开户银行': ['Bank', 'Bank'],
  '开户人': ['Account Holder', 'Pemegang Akaun'],
  '银行卡号': ['Bank Card Number', 'Nombor Kad Bank'],
  '银行账号 ACC': ['Bank Account', 'Akaun Bank'],
  '有效期': ['Valid Until', 'Sah Hingga'],
  '币种': ['Currency', 'Mata Wang'],
  '金额': ['Amount', 'Jumlah'],
  '用途': ['Purpose', 'Tujuan'],
  '日期': ['Date', 'Tarikh'],
  '月份': ['Month', 'Bulan'],
  '版本': ['Version', 'Versi'],
  '生效日期': ['Effective Date', 'Tarikh Berkuat Kuasa'],
  '失效日期': ['Expiry Date', 'Tarikh Tamat'],
  '语言与时区': ['Language & Time Zone', 'Bahasa & Zon Masa'],
  '视觉主题': ['Visual Themes', 'Tema Visual'],
  '当前账号与权限': ['Current Account & Permissions', 'Akaun Semasa & Kebenaran'],
  '演示数据与备份': ['Demo Data & Backup', 'Data Demo & Sandaran'],
  '界面语言 · 账号级偏好': ['Interface language · account preference', 'Bahasa antara muka · pilihan akaun'],
  '业务时区': ['Business Time Zone', 'Zon Masa Perniagaan'],
  '金额精度': ['Amount Precision', 'Ketepatan Jumlah'],
  '默认币种': ['Default Currency', 'Mata Wang Lalai'],
  '结算日': ['Settlement Day', 'Hari Penyelesaian'],
  '数据范围': ['Data Scope', 'Skop Data'],
  '导出权限': ['Export Permission', 'Kebenaran Eksport'],
  '结算权限': ['Settlement Permission', 'Kebenaran Penyelesaian'],
  '登录安全': ['Login Security', 'Keselamatan Log Masuk'],
  '全平台': ['Whole Platform', 'Seluruh Platform'],
  '本公司': ['This Company', 'Syarikat Ini'],
  '本代理树': ['This Agent Tree', 'Pokok Ejen Ini'],
  '只读本人收入': ['Read-only own income', 'Pendapatan sendiri baca sahaja'],
  '允许查看与处理': ['View and process', 'Lihat dan proses'],
  '导出数据备份': ['Export Data Backup', 'Eksport Sandaran Data'],
  '恢复演示数据': ['Restore Demo Data', 'Pulihkan Data Demo'],
  '数据体积': ['Data Size', 'Saiz Data'],
  '本地演示状态': ['Local demo state', 'Keadaan demo setempat'],
  '审计记录': ['Audit Records', 'Rekod Audit'],
  '关键操作留痕': ['Audit critical operations', 'Audit operasi penting'],
  '生产环境差异': ['Production Differences', 'Perbezaan Persekitaran Produksi'],
  '安全登录': ['Secure Login', 'Log Masuk Selamat'],
  '登录账号': ['Login Account', 'Akaun Log Masuk'],
  '登录密码': ['Login Password', 'Kata Laluan'],
  '登录失败': ['Login Failed', 'Log Masuk Gagal'],
  '测试账号': ['Demo Accounts', 'Akaun Demo'],
  '权限隔离已启用': ['Permission isolation enabled', 'Pengasingan kebenaran diaktifkan'],
  '顶部代理 / 子代理': ['Top Agent / Sub-agent', 'Ejen Utama / Sub-ejen'],
  '平台管理员': ['Platform Admin', 'Pentadbir Platform'],
  '公司负责人': ['Company Manager', 'Pengurus Syarikat'],
  '顶级代理': ['Top Agent', 'Ejen Utama'],
  '子代理': ['Sub-agent', 'Sub-ejen'],
  '平台 / 顶级代理直签': ['Platform / Top Agent Direct', 'Platform / Ejen Utama Terus'],
  '本人直管': ['Directly Managed', 'Diurus Terus'],
  '代理树': ['Agent Tree', 'Pokok Ejen'],
  '一级代理': ['Tier 1 Agent', 'Ejen Tahap 1'],
  '待处理提醒': ['Pending Reminders', 'Peringatan Tertunggak'],
  '当前结算月': ['Current Settlement Month', 'Bulan Penyelesaian Semasa'],
  '当前业务空间': ['Current Workspace', 'Ruang Kerja Semasa'],
  '切换演示角色': ['Switch Demo Role', 'Tukar Peranan Demo'],
  '退出登录': ['Log Out', 'Log Keluar'],
  '退出系统': ['Log Out', 'Log Keluar'],
  '返回角色选择页': ['Return to login', 'Kembali ke log masuk'],
  '刷新页面': ['Refresh page', 'Muat semula halaman'],
  '保存成功': ['Saved successfully', 'Berjaya disimpan'],
  '操作成功': ['Operation successful', 'Operasi berjaya'],
  '没有数据': ['No Data', 'Tiada Data'],
  '没有匹配的店铺': ['No matching shops', 'Tiada kedai sepadan'],
  '没有匹配的人头档案': ['No matching people', 'Tiada rekod individu sepadan'],
  '没有匹配的人头提交信息': ['No matching submissions', 'Tiada penyerahan sepadan'],
  '没有匹配的人头提交记录': ['No matching submission records', 'Tiada rekod penyerahan sepadan'],
  '没有匹配的流量卡': ['No matching data cards', 'Tiada kad data sepadan'],
  '还没有保护期类型': ['No protection period types yet', 'Belum ada jenis tempoh perlindungan'],
}

const dynamicPatterns: Array<[RegExp, Translation]> = [
  [/(\d+)\s*个月/g, ['$1 months', '$1 bulan']],
  [/(\d+)\s*家/g, ['$1 shops', '$1 kedai']],
  [/(\d+)\s*笔/g, ['$1 records', '$1 rekod']],
  [/(\d+)\s*个/g, ['$1 items', '$1 item']],
  [/(\d+)\s*条/g, ['$1 rows', '$1 baris']],
  [/(\d+)\s*天后到期/g, ['Due in $1 days', 'Luput dalam $1 hari']],
  [/(\d+)\s*天前/g, ['$1 days ago', '$1 hari lalu']],
]

const sortedEntries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length)

const translateValue = (value: string, language: Language) => {
  if (language === 'zh' || !value) return value
  const index = language === 'en' ? 0 : 1
  const trimmed = value.trim()
  if (dictionary[trimmed]) return value.replace(trimmed, dictionary[trimmed][index])
  let result = value
  for (const [source, translation] of sortedEntries) {
    if (result.includes(source)) result = result.replaceAll(source, translation[index])
  }
  for (const [pattern, translation] of dynamicPatterns) {
    result = result.replace(pattern, (_match, amount) => String(translation[index]).replace('$1', amount))
  }
  return result
}

const translateTextNode = (node: Node) => {
  const current = node.nodeValue || ''
  const translated = translateValue(current, state.language)
  if (translated !== current) node.nodeValue = translated
}

const translateAttributes = (element: Element) => {
  for (const attribute of ['placeholder', 'title', 'aria-label']) {
    const current = element.getAttribute(attribute)
    if (!current) continue
    const translated = translateValue(current, state.language)
    if (translated !== current) element.setAttribute(attribute, translated)
  }
}

const translateSubtree = (root: Node) => {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root)
    return
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return
  if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root as Element)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let current = walker.nextNode()
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) translateTextNode(current)
    else translateAttributes(current as Element)
    current = walker.nextNode()
  }
}

const observers = new WeakMap<HTMLElement, MutationObserver>()

export const i18nDirective: Directive<HTMLElement> = {
  mounted(element) {
    translateSubtree(element)
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') translateTextNode(record.target)
        else if (record.type === 'attributes' && record.target instanceof Element) translateAttributes(record.target)
        else for (const node of record.addedNodes) translateSubtree(node)
      }
    })
    observer.observe(element, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] })
    observers.set(element, observer)
  },
  updated(element) {
    translateSubtree(element)
  },
  unmounted(element) {
    observers.get(element)?.disconnect()
    observers.delete(element)
  },
}