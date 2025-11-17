// معرّف ملف Google Sheets من الرابط الذي أرسلته
// https://docs.google.com/spreadsheets/d/1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w/edit
var SHEET_ID = '1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w';

function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index') // اسم ملف الـ HTML (index.html)
    .setTitle('التحضير الإلكتروني')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// حفظ الطلب في Google Sheets
// يشمل:
// - رقم طلب تسلسلي
// - المحافظة + اللواء
// - مجموعات تراكمية لقيم الطلبات ورسوم التوصيل
function saveOrder(order) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheets()[0]; // أول شيت في الملف

    // إنشاء عناوين الأعمدة إذا كان الشيت فارغاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'رقم الطلب',                             // 1
        'التاريخ والوقت',                        // 2
        'الاسم',                                 // 3
        'الهاتف الأساسي',                       // 4
        'هاتف بديل',                             // 5
        'المحافظة',                              // 6
        'اللواء',                                // 7
        'العنوان التفصيلي',                     // 8
        'الدفع عند الاستلام',                   // 9
        'ملاحظات',                              // 10
        'عدد المنتجات',                          // 11
        'مجموع المنتجات (دنانير)',              // 12
        'رسوم التوصيل (دنانير)',                // 13
        'الإجمالي الكلي (دنانير)',              // 14
        'تفاصيل المنتجات',                       // 15
        'المجموع التراكمي لقيم الطلبات (دنانير)', // 16
        'المجموع التراكمي لرسوم التوصيل (دنانير)' // 17
      ]);
    }

    var lastRow = sheet.getLastRow();

    // حساب رقم الطلب التسلسلي (عدد الصفوف - 1 لأن الصف الأول للعناوين)
    var numOrdersBefore = lastRow - 1;
    var orderNumber = numOrdersBefore + 1; // 1، 2، 3، ...

    // أرقام الأعمدة المهمة بحسب الترتيب أعلاه
    var DELIVERY_FEE_COL = 13; // "رسوم التوصيل (دنانير)"
    var GRAND_TOTAL_COL  = 14; // "الإجمالي الكلي (دنانير)"

    // حساب المجموع التراكمي السابق لقيم الطلبات + رسوم التوصيل
    var totalOrdersBefore = 0;     // مجموع تراكمي سابق لقيم الطلبات
    var totalDeliveryBefore = 0;   // مجموع تراكمي سابق لرسوم التوصيل

    if (lastRow > 1) {
      // قراءة قيم عمود الإجمالي الكلي (من الصف 2 حتى آخر صف)
      var ordersRange = sheet.getRange(2, GRAND_TOTAL_COL, lastRow - 1, 1).getValues();
      for (var i = 0; i < ordersRange.length; i++) {
        var v = parseFloat(ordersRange[i][0]);
        if (!isNaN(v)) totalOrdersBefore += v;
      }

      // قراءة قيم عمود رسوم التوصيل (من الصف 2 حتى آخر صف)
      var feesRange = sheet.getRange(2, DELIVERY_FEE_COL, lastRow - 1, 1).getValues();
      for (var j = 0; j < feesRange.length; j++) {
        var f = parseFloat(feesRange[j][0]);
        if (!isNaN(f)) totalDeliveryBefore += f;
      }
    }

    // قيم الطلب الحالي
    var currentGrandTotal  = Number(order.grandTotal)  || 0; // إجمالي الطلب الحالي
    var currentDeliveryFee = Number(order.deliveryFee) || 0; // رسوم التوصيل الحالية

    // المجموع التراكمي الجديد
    var cumulativeOrders   = totalOrdersBefore   + currentGrandTotal;
    var cumulativeDelivery = totalDeliveryBefore + currentDeliveryFee;

    // تحويل تفاصيل المنتجات إلى نص
    var itemsText = '';
    if (order.items && order.items.length) {
      var lines = [];
      for (var k = 0; k < order.items.length; k++) {
        var it = order.items[k];
        lines.push(it.qty + ' × ' + it.name + ' (سعر: ' + it.price + ')');
      }
      itemsText = lines.join('\n');
    }

    // إضافة صف الطلب
    sheet.appendRow([
      orderNumber,                // رقم الطلب
      new Date(),                 // التاريخ والوقت
      order.name || '',           // الاسم
      order.phone || '',          // الهاتف الأساسي
      order.altPhone || '',       // هاتف بديل
      order.governorate || '',    // المحافظة
      order.district || '',       // اللواء
      order.address || '',        // العنوان التفصيلي
      order.cod ? 'نعم' : 'لا',   // الدفع عند الاستلام
      order.notes || '',          // ملاحظات
      order.itemsCount || 0,      // عدد المنتجات
      order.productsTotal || 0,   // مجموع المنتجات
      currentDeliveryFee || 0,    // رسوم التوصيل (لهذا الطلب)
      currentGrandTotal || 0,     // الإجمالي الكلي (لهذا الطلب)
      itemsText,                  // تفاصيل المنتجات
      cumulativeOrders,           // المجموع التراكمي لقيم الطلبات
      cumulativeDelivery          // المجموع التراكمي لرسوم التوصيل
    ]);

    // نُرجع رقم الطلب ليظهر للزبون في صفحة التأكيد
    return orderNumber;
  } catch (err) {
    Logger.log(err);
    throw err;
  }
}
