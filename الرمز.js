var SHEET_ID = '1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w';
var SHEET_NAME = 'الطلبات';
var WA_NUMBER = '0798382004';
var APP_VERSION = '2026-10-14-CUSTOMER-EDIT-V5';
var ADMIN_VERSION = '2026-10-14-FINANCE-V13';
var ADMIN_EMAILS = ['rabeerabee733@gmail.com'];
var ADMIN_LOG_SHEET_NAME = 'سجل الإدارة';
var ADMIN_META_SHEET_NAME = 'بيانات الإدارة';
var ADMIN_TRASH_SHEET_NAME = 'محذوفات الإدارة';

var RATE_LIMIT_SECONDS = 60;
var RESULT_CACHE_SECONDS = 600;
var MIN_FORM_TIME_MS = 1200;
var MAX_FORM_TIME_MS = 2 * 60 * 60 * 1000;

/*
  ترتيب الأعمدة النهائي:

  A  رقم الطلب
  B  تاريخ الطلب
  C  الاسم
  D  الهاتف الأساسي
  E  الهاتف البديل
  F  المحافظة
  G  اللواء
  H  العنوان التفصيلي
  I  إجمالي النسخ
  J  إجمالي المجلد
  K  إجمالي الورقي
  L  مجموع المنتجات
  M  رسوم التوصيل
  N  الإجمالي الكلي
  O  تفاصيل المنتجات
  P  الملاحظات
  Q  معرّف الطلب
*/

var PRODUCTS = {
  grade1_bag: {
    name: 'حقيبة الصف الأول',
    price: 10,
    splitAllowed: true,
    paperOnly: false
  },

  grade2_bag: {
    name: 'حقيبة الصف الثاني',
    price: 10,
    splitAllowed: true,
    paperOnly: false
  },

  grade3_bag: {
    name: 'حقيبة الصف الثالث',
    price: 10,
    splitAllowed: true,
    paperOnly: false
  },

  prep_grade1: {
    name: 'تحضير فقط صف أول',
    price: 7,
    splitAllowed: true,
    paperOnly: false
  },

  prep_grade2: {
    name: 'تحضير فقط صف ثاني',
    price: 7,
    splitAllowed: true,
    paperOnly: false
  },

  prep_grade3: {
    name: 'تحضير فقط صف ثالث',
    price: 7,
    splitAllowed: true,
    paperOnly: false
  },

  active_learning: {
    name: 'حقيبة التعلم النشط',
    price: 10,
    splitAllowed: false,
    paperOnly: false,
    soldOut: false
  },

  letter_cards: {
    name: 'بطاقات الحروف',
    price: 15,
    splitAllowed: false,
    paperOnly: false
  },

  number_cards: {
    name: 'بطاقات الأرقام',
    price: 10,
    splitAllowed: false,
    paperOnly: false
  },

  classroom_rules: {
    name: 'بطاقات القوانين الصفية',
    price: 5,
    splitAllowed: false,
    paperOnly: false,
    soldOut: false
  }
};

var DISTRICTS = {
  'عمان': [
    'قصبة عمان',
    'لواء ماركا',
    'لواء القويسمة',
    'لواء الجامعة',
    'لواء وادي السير',
    'لواء ناعور',
    'لواء سحاب',
    'لواء الجيزة',
    'لواء الموقر'
  ],

  'إربد': [
    'قصبة إربد',
    'لواء بني عبيد',
    'لواء المزار الشمالي',
    'لواء الرمثا',
    'لواء بني كنانة',
    'لواء الكورة',
    'لواء الأغوار الشمالية',
    'لواء الطيبة',
    'لواء الوسطية'
  ],

  'الزرقاء': [
    'قصبة الزرقاء',
    'لواء الرصيفة',
    'لواء الهاشمية',
    'لواء بيرين'
  ],

  'البلقاء': [
    'قصبة السلط',
    'لواء الشونة الجنوبية',
    'لواء دير علا',
    'لواء عين الباشا',
    'لواء ماحص والفحيص'
  ],

  'المفرق': [
    'قصبة المفرق',
    'لواء الرويشد',
    'لواء البادية الشمالية',
    'لواء البادية الشمالية الغربية',
    'لواء بلعما'
  ],

  'جرش': [
    'قصبة جرش'
  ],

  'عجلون': [
    'قصبة عجلون',
    'لواء كفرنجة'
  ],

  'مأدبا': [
    'قصبة مأدبا',
    'لواء ذيبان'
  ],

  'الكرك': [
    'قصبة الكرك',
    'لواء المزار الجنوبي',
    'لواء الأغوار الجنوبية',
    'لواء القصر',
    'لواء القطرانة',
    'لواء عي',
    'لواء فقوع'
  ],

  'الطفيلة': [
    'قصبة الطفيلة',
    'لواء بصيرا',
    'لواء الحسا'
  ],

  'معان': [
    'قصبة معان',
    'لواء البتراء (إقليم البتراء)',
    'لواء الشوبك',
    'لواء الحسينية'
  ],

  'العقبة': [
    'قصبة العقبة',
    'لواء القويرة',
    'لواء وادي عربة'
  ]
};

/**
 * يدعم:
 *   ?action=ping
 *   ?action=orderStatus&requestId=...&callback=...
 *   ?action=status&requestId=...&callback=...  (للتوافق)
 */
function doGet(e) {
  e = e || {};

  var params =
    e.parameter || {};

  var action =
    cleanText_(
      params.action,
      50
    );

  if (action === 'editOrder') { return serveCustomerEdit_(); }
  if (action === 'track') { return serveCustomerTracking_(); }
  if (action === 'employee') { return serveAdmin_(true); }
  if (action === 'ajyalAdmin') { return serveAjyalAdmin_(); }

  if (action === 'admin') {
    return serveAdmin_();
  }

  if (action === 'ping') {
    var pingResult = {
      ok: true,
      version: APP_VERSION,
      time: new Date().toISOString()
    };

    var pingCallback =
      safeCallbackName_(
        params.callback
      );

    if (pingCallback) {
      return jsonpResponse_(
        pingCallback,
        pingResult
      );
    }

    return ContentService
      .createTextOutput(
        JSON.stringify(
          pingResult
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }

  if (
    action === 'orderStatus' ||
    action === 'status'
  ) {
    return statusResponse_(
      params
    );
  }

  return HtmlService
    .createHtmlOutput(
      '<!DOCTYPE html>' +
      '<html lang="ar" dir="rtl">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>خدمة استقبال الطلبات</title>' +
      '</head>' +
      '<body style="font-family:Arial;text-align:center;padding:35px">' +
      '<h2>خدمة استقبال الطلبات تعمل بنجاح ✅</h2>' +
      '<p>الإصدار: ' +
      APP_VERSION +
      '</p>' +
      '</body>' +
      '</html>'
    );
}

/**
 * استقبال POST مرة واحدة من صفحة GitHub.
 */
function doPost(e) {
  if (e && e.parameter && e.parameter.waBridge === '1') return waBridge_(e);
  var result;
  var requestId = '';

  try {
    if (
      !e ||
      !e.parameter ||
      !e.parameter.data
    ) {
      result = errorResult_(
        'EMPTY_REQUEST',
        'لم يتم استلام بيانات الطلب.',
        ''
      );

    } else {
      var data =
        JSON.parse(
          e.parameter.data
        );

      requestId =
        cleanId_(
          data.requestId,
          80
        );

      result =
        saveOrder_(
          data
        );
    }

  } catch (error) {
    result = errorResult_(
      'INVALID_REQUEST',
      'تعذر قراءة بيانات الطلب: ' +
      String(error),
      requestId
    );
  }

  storeTemporaryResult_(
    result
  );

  /*
   * الرد داخل iframe غير مستخدم لعرض رقم الطلب.
   * صفحة GitHub تستعلم عن الحالة بواسطة requestId.
   */
  return HtmlService
    .createHtmlOutput(
      '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0"></body></html>'
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}

function statusResponse_(params) {
  var callback =
    safeCallbackName_(
      params.callback
    );

  var requestId =
    cleanId_(
      params.requestId,
      80
    );

  if (!callback) {
    return ContentService
      .createTextOutput(
        '/* invalid callback */'
      )
      .setMimeType(
        ContentService.MimeType.JAVASCRIPT
      );
  }

  if (!requestId) {
    return jsonpResponse_(
      callback,
      {
        ready: true,
        version: APP_VERSION,
        result: errorResult_(
          'MISSING_REQUEST_ID',
          'معرّف الطلب مفقود.',
          ''
        )
      }
    );
  }

  var result = null;

  try {
    var sheet =
      SpreadsheetApp
        .openById(
          SHEET_ID
        )
        .getSheetByName(
          SHEET_NAME
        );

    if (sheet) {
      result =
        findResultByRequestId_(
          sheet,
          requestId
        );
    }
  } catch (ignoredSheet) {
    result = null;
  }

  if (!result) {
    result =
      readTemporaryResult_(
        requestId
      );
  }

  return jsonpResponse_(
    callback,
    {
      ready: Boolean(result),
      version: APP_VERSION,
      result: result
    }
  );
}

function saveOrder_(data) {
  data = data || {};

  var requestId =
    cleanId_(
      data.requestId,
      80
    );

  var clientId =
    cleanId_(
      data.clientId,
      100
    );

  var cache =
    CacheService.getScriptCache();

  var lock =
    LockService.getScriptLock();

  var locked = false;

  if (!requestId) {
    return errorResult_(
      'MISSING_REQUEST_ID',
      'تعذر إنشاء معرّف للطلب. حدّث الصفحة ثم أعد المحاولة.',
      ''
    );
  }

  var ajyal = normalizeAjyal_(data.ajyal, data.items);

  var cachedResult =
    readTemporaryResult_(
      requestId
    );

  if (cachedResult) {
    return cachedResult;
  }

  try {
    locked =
      lock.tryLock(
        20000
      );

    if (!locked) {
      return errorResult_(
        'SERVER_BUSY',
        'النظام مشغول حاليًا، يرجى المحاولة بعد قليل.',
        requestId
      );
    }

    var sheet =
      SpreadsheetApp
        .openById(
          SHEET_ID
        )
        .getSheetByName(
          SHEET_NAME
        );

    if (!sheet) {
      return errorResult_(
        'SHEET_NOT_FOUND',
        'لم يتم العثور على ورقة باسم: ' +
        SHEET_NAME,
        requestId
      );
    }

    ensureHeaders_(
      sheet
    );

    var previousResult =
      findResultByRequestId_(
        sheet,
        requestId
      );

    if (previousResult) {
      // A retry must never recreate Ajyal entries after the customer edited the booking.
      return previousResult;
    }

    if (
      cleanText_(
        data.website,
        200
      )
    ) {
      return errorResult_(
        'SPAM_DETECTED',
        'تعذر إرسال الطلب.',
        requestId
      );
    }

    var formOpenedAt =
      Number(
        data.formOpenedAt
      ) || 0;

    var elapsedTime =
      Date.now() -
      formOpenedAt;

    if (
      !formOpenedAt ||
      elapsedTime <
        MIN_FORM_TIME_MS ||
      elapsedTime >
        MAX_FORM_TIME_MS
    ) {
      return errorResult_(
        'INVALID_FORM_TIME',
        'حدّث الصفحة ثم عبّئ الطلب وأرسله من جديد.',
        requestId
      );
    }

    var name =
      cleanText_(
        data.name,
        100
      );

    var phoneInput =
      cleanText_(
        data.phone,
        30
      );

    var altPhoneInput =
      cleanText_(
        data.altPhone,
        30
      );

    var governorate =
      cleanText_(
        data.governorate,
        50
      );

    var district =
      cleanText_(
        data.district,
        100
      );

    var address =
      cleanText_(
        data.address,
        500
      );

    var notes =
      cleanText_(
        data.notes,
        1000
      );

    if (
      !name ||
      !phoneInput ||
      !governorate ||
      !district ||
      !address
    ) {
      return errorResult_(
        'MISSING_FIELDS',
        'يرجى تعبئة الاسم والهاتف والمحافظة واللواء والعنوان التفصيلي.',
        requestId
      );
    }

    if (
      !DISTRICTS[
        governorate
      ] ||
      DISTRICTS[
        governorate
      ].indexOf(
        district
      ) === -1
    ) {
      return errorResult_(
        'INVALID_LOCATION',
        'المحافظة أو اللواء غير صحيح.',
        requestId
      );
    }

    var mainPhone =
      canonicalPhone_(
        phoneInput
      );

    var secondPhone =
      canonicalPhone_(
        altPhoneInput
      );

    if (!mainPhone) {
      return errorResult_(
        'INVALID_PHONE',
        'رقم الهاتف الأساسي غير صحيح؛ يجب أن يبدأ بـ 07 ويتكون من 10 خانات.',
        requestId
      );
    }

    if (
      altPhoneInput &&
      !secondPhone
    ) {
      return errorResult_(
        'INVALID_ALT_PHONE',
        'رقم الهاتف البديل غير صحيح أو اتركه فارغًا.',
        requestId
      );
    }

    if (
      secondPhone &&
      secondPhone ===
        mainPhone
    ) {
      return errorResult_(
        'SAME_PHONE',
        'رقم الهاتف البديل يجب أن يكون مختلفًا.',
        requestId
      );
    }

    var itemsResult =
      sanitizeItems_(
        data.items
      );

    if (!itemsResult.ok) {
      return errorResult_(
        'INVALID_ITEMS',
        itemsResult.message,
        requestId
      );
    }

    var items =
      itemsResult.items;

    if (!items.length) {
      return errorResult_(
        'NO_ITEMS',
        'يرجى اختيار منتج واحد على الأقل.',
        requestId
      );
    }

    if (
      phoneExists_(
        sheet,
        mainPhone
      ) ||
      (
        secondPhone &&
        phoneExists_(
          sheet,
          secondPhone
        )
      )
    ) {
      return {
        result: 'error',
        code: 'DUPLICATE_PHONE',
        message:
          'تم إرسال طلب سابق بهذا الرقم. ' +
          'لتعديل الطلب تواصل معنا عبر واتساب: ' +
          WA_NUMBER,
        whatsapp: WA_NUMBER,
        whatsappLink:
          'https://wa.me/962' +
          WA_NUMBER.substring(1),
        requestId: requestId
      };
    }

    var phoneKey =
      'rate_phone_' +
      mainPhone;

    var clientKey =
      clientId
        ? 'rate_client_' +
          clientId
        : '';

    if (
      cache.get(
        phoneKey
      ) ||
      (
        clientKey &&
        cache.get(
          clientKey
        )
      )
    ) {
      return errorResult_(
        'TOO_MANY_REQUESTS',
        'تمت محاولة إرسال طلب قبل لحظات. انتظر دقيقة واحدة.',
        requestId
      );
    }

    var totals =
      calculateTotals_(
        items,
        governorate,
        ajyal.length
      );

    var orderNumber =
      nextOrderNumber_(
        sheet
      );

    var row =
      sheet.getLastRow() +
      1;

    var values = [[
      orderNumber,                        // A
      new Date(),                         // B
      name,                               // C
      displayPhone_(mainPhone),           // D
      secondPhone
        ? displayPhone_(secondPhone)
        : '',                             // E
      governorate,                        // F
      district,                           // G
      address,                            // H
      totals.itemsCount,                  // I
      totals.folderCount,                 // J
      totals.paperCount,                  // K
      totals.productsTotal + totals.ajyalTotal, // L: products and services
      totals.deliveryFee,                 // M
      totals.grandTotal,                  // N
      itemsText_(items) + (totals.ajyalCount ? '\nخدمة أجيال — عدد المعلمين: '+totals.ajyalCount+' — المجموع: '+totals.ajyalTotal+' د.أ' : ''), // O
      notes,                              // P
      requestId                           // Q
    ]];

    var range =
      sheet.getRange(
        row,
        1,
        1,
        17
      );

    range.setNumberFormats([[
      '0',
      'yyyy-MM-dd HH:mm:ss',
      '@',
      '@',
      '@',
      '@',
      '@',
      '@',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
      '@',
      '@',
      '@'
    ]]);

    range.setValues(
      values
    );

    try {
      saveAjyal_(data, orderNumber, requestId);
      customerEditRegister_(data);
      SpreadsheetApp.flush();
    } catch (serviceError) {
      sheet.deleteRow(row);
      throw serviceError;
    }

    cache.put(
      phoneKey,
      '1',
      RATE_LIMIT_SECONDS
    );

    if (clientKey) {
      cache.put(
        clientKey,
        '1',
        RATE_LIMIT_SECONDS
      );
    }

    var successResult = {
      result: 'success',
      code: 'ORDER_SAVED',
      customerEditReady: Boolean(data.customerEditToken),
      ajyalCount:totals.ajyalCount,
      ajyalTotal:totals.ajyalTotal,
      orderId: orderNumber,
      orderNumber: orderNumber,
      itemsCount:
        totals.itemsCount,
      folderCount:
        totals.folderCount,
      paperCount:
        totals.paperCount,
      productsTotal:
        totals.productsTotal,
      deliveryFee:
        totals.deliveryFee,
      grandTotal:
        totals.grandTotal,
      requestId:
        requestId
    };

    storeTemporaryResult_(
      successResult
    );

    return successResult;

  } catch (error) {
    return errorResult_(
      'SERVER_ERROR',
      'حدث خطأ أثناء حفظ الطلب: ' +
      String(error),
      requestId
    );

  } finally {
    if (locked) {
      lock.releaseLock();
    }
  }
}

function ensureHeaders_(sheet) {
  var headers = [[
    'رقم الطلب',
    'تاريخ الطلب',
    'الاسم',
    'رقم الهاتف الأساسي',
    'رقم الهاتف البديل',
    'المحافظة',
    'اللواء',
    'العنوان التفصيلي',
    'إجمالي النسخ',
    'إجمالي المجلد',
    'إجمالي الورقي',
    'مجموع المنتجات (دنانير)',
    'رسوم التوصيل (دينار)',
    'الإجمالي الكلي (دينار)',
    'تفاصيل المنتجات',
    'الملاحظات',
    'معرّف الطلب'
  ]];

  sheet
    .getRange(
      1,
      1,
      1,
      17
    )
    .setValues(
      headers
    );

  sheet.setFrozenRows(
    1
  );
}

function findResultByRequestId_(
  sheet,
  requestId
) {
  if (
    !requestId ||
    sheet.getLastRow() <
      2
  ) {
    return null;
  }

  var match =
    sheet
      .getRange(
        2,
        17,
        sheet.getLastRow() -
          1,
        1
      )
      .createTextFinder(
        requestId
      )
      .matchEntireCell(
        true
      )
      .findNext();

  if (!match) {
    return null;
  }

  var row =
    match.getRow();

  var values =
    sheet
      .getRange(
        row,
        1,
        1,
        17
      )
      .getDisplayValues()[0];

  var serviceMatch=String(values[14]||'').match(/خدمة أجيال — عدد المعلمين: (\d+) — المجموع: (\d+)/);
  var ajyalCount=serviceMatch?Number(serviceMatch[1]):0,ajyalTotal=serviceMatch?Number(serviceMatch[2]):0;
  return {
    ajyalCount:ajyalCount,
    ajyalTotal:ajyalTotal,
    result: 'success',
    code: 'ORDER_SAVED',
    customerEditReady: typeof customerEditSheet_ === 'function' && Boolean(customerEditFind_(customerEditSheet_(false),1,requestId)),
    orderId:
      values[0],
    orderNumber:
      values[0],
    itemsCount:
      numberFromDisplay_(
        values[8]
      ),
    folderCount:
      numberFromDisplay_(
        values[9]
      ),
    paperCount:
      numberFromDisplay_(
        values[10]
      ),
    productsTotal:
      numberFromDisplay_(
        values[11]
      ) - ajyalTotal,
    deliveryFee:
      numberFromDisplay_(
        values[12]
      ),
    grandTotal:
      numberFromDisplay_(
        values[13]
      ),
    requestId:
      requestId
  };
}

function storeTemporaryResult_(
  result
) {
  if (
    !result ||
    !result.requestId
  ) {
    return;
  }

  CacheService
    .getScriptCache()
    .put(
      'order_result_' +
      cleanId_(
        result.requestId,
        80
      ),
      JSON.stringify(
        result
      ),
      RESULT_CACHE_SECONDS
    );
}

function readTemporaryResult_(
  requestId
) {
  if (!requestId) {
    return null;
  }

  var cached =
    CacheService
      .getScriptCache()
      .get(
        'order_result_' +
        requestId
      );

  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(
      cached
    );
  } catch (ignored) {
    return null;
  }
}

function sanitizeItems_(
  items
) {
  if (!Array.isArray(items)) {
    return {
      ok: false,
      items: [],
      message:
        'بيانات المنتجات غير صحيحة.'
    };
  }

  var cleanItems = [];
  var seen = {};

  for (
    var i = 0;
    i < items.length;
    i++
  ) {
    var rawItem =
      items[i] || {};

    var id =
      cleanText_(
        rawItem.productId,
        80
      );

    var product =
      PRODUCTS[id];

    if (!product) {
      return {
        ok: false,
        items: [],
        message:
          'يوجد منتج غير معتمد ضمن الطلب.'
      };
    }

    if (product.soldOut === true) {
      return {
        ok: false,
        items: [],
        message:
          'نفدت كمية ' + product.name + ' وتم إيقاف الحجز فيها.'
      };
    }

    if (seen[id]) {
      return {
        ok: false,
        items: [],
        message:
          'يوجد منتج مكرر ضمن الطلب.'
      };
    }

    seen[id] = true;

    var qty =
      integer_(
        rawItem.qty
      );

    var folderQty =
      integer_(
        rawItem.folderQty
      );

    var paperQty =
      integer_(
        rawItem.paperQty
      );

    if (
      qty < 1 ||
      qty > 99
    ) {
      return {
        ok: false,
        items: [],
        message:
          'كمية أحد المنتجات غير صحيحة.'
      };
    }

    if (
      product
        .splitAllowed
    ) {
      if (
        folderQty <= 0 &&
        paperQty <= 0
      ) {
        return {
          ok: false,
          items: [],
          message:
            'يجب اختيار عدد ورقي أو مجلد لكل منتج محدد.'
        };
      }

      if (
        folderQty < 0 ||
        paperQty < 0 ||
        folderQty > 99 ||
        paperQty > 99 ||
        folderQty +
        paperQty !== qty
      ) {
        return {
          ok: false,
          items: [],
          message:
            'يجب أن يساوي مجموع المجلد والورقي العدد الكلي لكل منتج.'
        };
      }

    } else if (
      product
        .paperOnly
    ) {
      folderQty = 0;
      paperQty = qty;

    } else {
      folderQty = 0;
      paperQty = 0;
    }

    cleanItems.push({
      productId: id,
      name:
        product.name,
      price:
        product.price,
      qty:
        qty,
      folderQty:
        folderQty,
      paperQty:
        paperQty,
      splitAllowed:
        product
          .splitAllowed === true,
      paperOnly:
        product
          .paperOnly === true
    });
  }

  return {
    ok: true,
    items: cleanItems,
    message: ''
  };
}

function calculateTotals_(
  items,
  governorate,
  ajyalCount
) {
  var itemsCount = 0;
  var folderCount = 0;
  var paperCount = 0;
  var productsTotal = 0;

  for (
    var i = 0;
    i < items.length;
    i++
  ) {
    itemsCount +=
      items[i].qty;

    folderCount +=
      items[i].folderQty;

    paperCount +=
      items[i].paperQty;

    productsTotal +=
      items[i].price *
      items[i].qty;
  }

  var deliveryFee =
    governorate === 'عمان'
      ? 2
      : 3;

  ajyalCount=Number(ajyalCount)||0;
  var ajyalTotal=ajyalCount*3;
  return {
    itemsCount:
      itemsCount,
    folderCount:
      folderCount,
    paperCount:
      paperCount,
    productsTotal:
      productsTotal,
    deliveryFee:
      deliveryFee,
    ajyalCount:ajyalCount,
    ajyalTotal:ajyalTotal,
    grandTotal:
      productsTotal +
      deliveryFee + ajyalTotal
  };
}

function canonicalPhone_(
  phone
) {
  var value =
    String(
      phone || ''
    ).replace(
      /\D/g,
      ''
    );

  if (
    value.indexOf(
      '00962'
    ) === 0
  ) {
    value =
      value.substring(
        5
      );

  } else if (
    value.indexOf(
      '962'
    ) === 0
  ) {
    value =
      value.substring(
        3
      );
  }

  if (
    value.indexOf(
      '0'
    ) === 0
  ) {
    value =
      value.substring(
        1
      );
  }

  if (
    value.length > 9
  ) {
    value =
      value.slice(
        -9
      );
  }

  return /^7\d{8}$/
    .test(value)
      ? value
      : '';
}

function displayPhone_(
  canonical
) {
  return canonical
    ? '0' +
      canonical
    : '';
}

function phoneExists_(
  sheet,
  phone
) {
  if (
    !phone ||
    sheet.getLastRow() <
      2
  ) {
    return false;
  }

  var values =
    sheet
      .getRange(
        2,
        4,
        sheet.getLastRow() -
          1,
        2
      )
      .getDisplayValues();

  for (
    var i = 0;
    i < values.length;
    i++
  ) {
    if (
      canonicalPhone_(
        values[i][0]
      ) === phone ||
      canonicalPhone_(
        values[i][1]
      ) === phone
    ) {
      return true;
    }
  }

  return false;
}

function nextOrderNumber_(
  sheet
) {
  var maximum = 0;

  if (
    sheet.getLastRow() >=
      2
  ) {
    var values =
      sheet
        .getRange(
          2,
          1,
          sheet.getLastRow() -
            1,
          1
        )
        .getDisplayValues();

    for (
      var i = 0;
      i < values.length;
      i++
    ) {
      var current =
        Number(
          String(
            values[i][0]
          ).replace(
            /[^\d]/g,
            ''
          )
        );

      if (
        isFinite(current) &&
        current > maximum
      ) {
        maximum =
          current;
      }
    }
  }

  var savedFloor = Number(
    PropertiesService
      .getScriptProperties()
      .getProperty('ADMIN_ORDER_NUMBER_FLOOR') ||
      0
  );

  if (
    isFinite(savedFloor) &&
    savedFloor > maximum
  ) {
    maximum = savedFloor;
  }

  return maximum + 1;
}

function rememberOrderNumberFloor_(
  orderNumber
) {
  var numericOrder = Number(
    String(orderNumber || '')
      .replace(/[^\d]/g, '')
  );

  if (!isFinite(numericOrder) || numericOrder < 1) {
    return;
  }

  var properties = PropertiesService.getScriptProperties();
  var currentFloor = Number(
    properties.getProperty('ADMIN_ORDER_NUMBER_FLOOR') ||
    0
  );

  if (!isFinite(currentFloor) || numericOrder > currentFloor) {
    properties.setProperty(
      'ADMIN_ORDER_NUMBER_FLOOR',
      String(numericOrder)
    );
  }
}

function itemsText_(
  items
) {
  var lines = [];

  for (
    var i = 0;
    i < items.length;
    i++
  ) {
    var item =
      items[i];

    var parts = [
      (i + 1) +
      ') ' +
      item.name,
      'العدد: ' +
      item.qty
    ];

    if (
      item.splitAllowed
    ) {
      if (Number(item.folderQty) > 0) parts.push('مجلد: ' + item.folderQty);

      if (Number(item.paperQty) > 0) parts.push('ورقي: ' + item.paperQty);

    } else if (
      item.paperOnly
    ) {
      parts.push(
        'ورقي فقط: ' +
        item.paperQty
      );
    }

    parts.push(
      'المجموع: ' +
      (
        item.price *
        item.qty
      ) +
      ' د'
    );

    lines.push(
      parts.join(
        ' — '
      )
    );
  }

  return lines.join(
    '\n'
  );
}

function safeCallbackName_(
  value
) {
  var callback =
    String(
      value || ''
    );

  return /^[A-Za-z_$][A-Za-z0-9_$]{0,80}$/
    .test(callback)
      ? callback
      : '';
}

function jsonpResponse_(
  callback,
  value
) {
  var payload =
    JSON.stringify(
      value
    )
      .replace(
        /</g,
        '\\u003c'
      )
      .replace(
        /\u2028/g,
        '\\u2028'
      )
      .replace(
        /\u2029/g,
        '\\u2029'
      );

  return ContentService
    .createTextOutput(
      callback +
      '(' +
      payload +
      ');'
    )
    .setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
}

function cleanText_(
  value,
  maxLength
) {
  var text =
    String(
      value || ''
    ).trim();

  return maxLength &&
    text.length >
      maxLength
    ? text.substring(
        0,
        maxLength
      )
    : text;
}

function cleanId_(
  value,
  maxLength
) {
  return String(
    value || ''
  )
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ''
    )
    .substring(
      0,
      maxLength
    );
}

function integer_(
  value
) {
  var number =
    Math.floor(
      Number(
        value
      )
    );

  return isFinite(
    number
  )
    ? number
    : 0;
}

function numberFromDisplay_(
  value
) {
  var normalized =
    String(
      value || ''
    )
      .replace(
        /,/g,
        ''
      )
      .replace(
        /[^\d.\-]/g,
        ''
      );

  var number =
    Number(
      normalized
    );

  return isFinite(
    number
  )
    ? number
    : 0;
}

function errorResult_(
  code,
  message,
  requestId
) {
  return {
    result: 'error',
    code: code,
    message: message,
    requestId:
      requestId || ''
  };
}

/* ========================================================================
 * واجهة الإدارة المستقلة - الإصدار V2
 * لا يغيّر بنية ورقة الطلبات الأساسية. الحالات والدفع والمحذوفات في تبويبات منفصلة.
 * ====================================================================== */

var ADMIN_STATUSES = ['جديد', 'قيد التجهيز', 'جاهز', 'خرج للتوصيل', 'تم التسليم', 'ملغي'];
var ADMIN_PAYMENT_STATUSES = ['غير مدفوع', 'مدفوع جزئيًا', 'مدفوع'];
var ADMIN_PRIORITIES = ['عادي', 'مستعجل'];

function serveAdmin_(employeeEntry) {
  var auth = adminAuth_();

  var template = HtmlService.createTemplateFromFile('Admin');
  template.employeeEntry = Boolean(employeeEntry);
  return template.evaluate()
    .setTitle('إدارة طلبات التحضير الإلكتروني')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .setFaviconUrl('https://rabeerabee733-eng.github.io/google-apps-script-project/mobile/icon-brand-v2-192.png')
    .addMetaTag('viewport', 'width=device-width,initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function adminAuth_() {
  var email = String(Session.getActiveUser().getEmail() || '')
    .trim()
    .toLowerCase();

  return {
    ok: Boolean(email && ADMIN_EMAILS.indexOf(email) !== -1),
    email: email
  };
}

function requireAdmin_() {
  if (typeof portalContext_ !== 'undefined' && portalContext_) return portalContext_;
  var auth = adminAuth_();
  if (!auth.ok) {
    throw new Error('ليس لديك تصريح لاستخدام واجهة الإدارة.');
  }
  return auth;
}

function adminBootstrap() {
  var auth = requireAdmin_();
  adminEnsureSupportSheets_();

  var productList = [];
  var key;
  for (key in PRODUCTS) {
    if (PRODUCTS.hasOwnProperty(key)) {
      productList.push({
        key: key,
        name: PRODUCTS[key].name,
        price: PRODUCTS[key].price,
        splitAllowed: PRODUCTS[key].splitAllowed,
        paperOnly: PRODUCTS[key].paperOnly,
        soldOut: Boolean(PRODUCTS[key].soldOut)
      });
    }
  }

  return {
    ok: true,
    email: auth.email,
    version: ADMIN_VERSION,
    products: productList,
    districts: DISTRICTS,
    statuses: ADMIN_STATUSES,
    paymentStatuses: ADMIN_PAYMENT_STATUSES,
    priorities: ADMIN_PRIORITIES
  };
}

/* توافق مع الواجهة القديمة إن كانت مخزنة في المتصفح. */
function adminSearchOrders(query) {
  var result = adminListOrders({ query: query, limit: 100 });
  return result.rows;
}

function adminListOrders(filters) {
  requireAdmin_();
  filters = filters || {};

  var sheet = adminOrdersSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { rows: [], totalMatched: 0 };

  var count = lastRow - 1;
  var raw = sheet.getRange(2, 1, count, 17).getValues();
  var display = sheet.getRange(2, 1, count, 17).getDisplayValues();
  var metaMap = adminMetaMap_();
  var timezone = SpreadsheetApp.openById(SHEET_ID).getSpreadsheetTimeZone();

  var query = cleanText_(filters.query, 120).toLowerCase();
  var digits = query.replace(/\D/g, '');
  var productText = cleanText_(filters.productText, 200).toLowerCase();
  var statusFilter = cleanText_(filters.status, 50);
  var paymentFilter = cleanText_(filters.paymentStatus, 50);
  var governorateFilter = cleanText_(filters.governorate, 50);
  var districtFilter = cleanText_(filters.district, 100);
  var prepType = cleanText_(filters.prepType, 30);
  var dateFrom = cleanText_(filters.dateFrom, 20);
  var dateTo = cleanText_(filters.dateTo, 20);
  var todayOnly = Boolean(filters.todayOnly);
  var todayKey = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
  var minOrder = adminOptionalNumber_(filters.minOrder);
  var maxOrder = adminOptionalNumber_(filters.maxOrder);
  var limit = Math.max(1, Math.min(Number(filters.limit) || 300, 1000));

  var results = [];
  var matched = 0;

  for (var i = display.length - 1; i >= 0; i--) {
    var row = display[i];
    var rawRow = raw[i];
    var orderNumber = adminOrderNumber_(row[0]);
    var name = String(row[2] || '').toLowerCase();
    var phone1 = String(row[3] || '').replace(/\D/g, '');
    var phone2 = String(row[4] || '').replace(/\D/g, '');
    var requestId = String(row[16] || '');
    var requestLower = requestId.toLowerCase();
    var meta = metaMap[requestId] || adminDefaultMeta_(requestId, row[0]);
    var dateKey = adminDateKey_(rawRow[1], timezone);
    var folderCount = numberFromDisplay_(row[9]);
    var paperCount = numberFromDisplay_(row[10]);

    if (query) {
      var queryMatches =
        String(row[0] || '').toLowerCase() === query ||
        name.indexOf(query) !== -1 ||
        requestLower.indexOf(query) !== -1 ||
        String(row[7] || '').toLowerCase().indexOf(query) !== -1 ||
        (digits.length >= 3 && (phone1.indexOf(digits) !== -1 || phone2.indexOf(digits) !== -1));
      if (!queryMatches) continue;
    }

    if (minOrder !== null && orderNumber < minOrder) continue;
    if (maxOrder !== null && orderNumber > maxOrder) continue;
    if (dateFrom && (!dateKey || dateKey < dateFrom)) continue;
    if (dateTo && (!dateKey || dateKey > dateTo)) continue;
    if (todayOnly && dateKey !== todayKey) continue;
    if (governorateFilter && row[5] !== governorateFilter) continue;
    if (districtFilter && row[6] !== districtFilter) continue;
    if (statusFilter && meta.status !== statusFilter) continue;
    if (paymentFilter && meta.paymentStatus !== paymentFilter) continue;
    if (productText && String(row[14] || '').toLowerCase().indexOf(productText) === -1) continue;

    if (prepType === 'مجلد' && folderCount <= 0) continue;
    if (prepType === 'ورقي' && paperCount <= 0) continue;
    if (prepType === 'مختلط' && !(folderCount > 0 && paperCount > 0)) continue;

    matched++;
    if (results.length < limit) {
      results.push(adminDecorateOrder_(adminRowToObject_(row, i + 2), meta));
    }
  }

  var customerChanges=typeof customerEditChanges_==='function'?customerEditChanges_():{};
  results.forEach(function(o){o.customerEditedAt=customerChanges[o.requestId]||'';});
  return { rows: results, totalMatched: matched };
}

function adminDashboardData() {
  requireAdmin_();
  var sheet = adminOrdersSheet_();
  var lastRow = sheet.getLastRow();
  var metaMap = adminMetaMap_();
  var timezone = SpreadsheetApp.openById(SHEET_ID).getSpreadsheetTimeZone();
  var todayKey = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');

  var result = {
    sentOrders: 0,
    sentValue: 0,
    todaySentOrders: 0,
    todaySentValue: 0,
    totalOrders: 0,
    totalValue: 0,
    todayOrders: 0,
    todayValue: 0,
    todayItems: 0,
    todayFolders: 0,
    todayPaper: 0,
    outstandingValue: 0,
    statusCounts: {},
    paymentCounts: {}
  };

  for (var s = 0; s < ADMIN_STATUSES.length; s++) result.statusCounts[ADMIN_STATUSES[s]] = 0;
  for (var p = 0; p < ADMIN_PAYMENT_STATUSES.length; p++) result.paymentCounts[ADMIN_PAYMENT_STATUSES[p]] = 0;
  if (lastRow < 2) return result;

  var count = lastRow - 1;
  var raw = sheet.getRange(2, 1, count, 17).getValues();
  var display = sheet.getRange(2, 1, count, 17).getDisplayValues();

  var stickerSent=stickerSentMap_(stickerExportLedger_()),sentTodayKey=Utilities.formatDate(new Date(),'Asia/Amman','yyyy-MM-dd');
  for (var i = 0; i < display.length; i++) {
    var row = display[i];
    var requestId = String(row[16] || '');
    var meta = metaMap[requestId] || adminDefaultMeta_(requestId, row[0]);
    var grand = numberFromDisplay_(row[13]);
    var paid = Number(meta.amountPaid) || 0;
    var dateKey = adminDateKey_(raw[i][1], timezone);

    var firstExport=stickerSent[stickerExportKey_(row)];
    if(firstExport){result.sentOrders++;result.sentValue+=grand;if(Utilities.formatDate(new Date(firstExport),'Asia/Amman','yyyy-MM-dd')===sentTodayKey){result.todaySentOrders++;result.todaySentValue+=grand;}}
    result.totalOrders++;
    result.totalValue += grand;
    result.statusCounts[meta.status] = (result.statusCounts[meta.status] || 0) + 1;
    result.paymentCounts[meta.paymentStatus] = (result.paymentCounts[meta.paymentStatus] || 0) + 1;
    result.outstandingValue += Math.max(0, grand - paid);

    if (dateKey === todayKey) {
      result.todayOrders++;
      result.todayValue += grand;
      result.todayItems += numberFromDisplay_(row[8]);
      result.todayFolders += numberFromDisplay_(row[9]);
      result.todayPaper += numberFromDisplay_(row[10]);
    }
  }

  result.sentValue=adminRound2_(result.sentValue);
  result.todaySentValue=adminRound2_(result.todaySentValue);
  result.totalValue = adminRound2_(result.totalValue);
  result.todayValue = adminRound2_(result.todayValue);
  result.outstandingValue = adminRound2_(result.outstandingValue);
  return result;
}

function adminGetOrder(rowNumber, requestId) {
  requireAdmin_();
  var sheet = adminOrdersSheet_();
  var row = adminFindRowByRequestId_(sheet, requestId, rowNumber);
  var values = sheet.getRange(row, 1, 1, 17).getDisplayValues()[0];
  var meta = adminGetMeta_(values[16], values[0]);
  var order=adminDecorateOrder_(adminRowToObject_(values, row), meta);
  order.customerEdit=customerEditState_(values);
  order.customerEditedAt=customerEditChanges_()[String(values[16])]||'';
  order.revision=customerEditRevision_(values,customerEditTeachers_(String(values[16])));
  return order;
}

function adminUpdateOrder(payload) {
  var auth = requireAdmin_();
  payload = payload || {};

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول الآن؛ حاول بعد لحظات.');

  try {
    var sheet = adminOrdersSheet_();
    var requestId = cleanId_(payload.requestId, 80);
    var row = adminFindRowByRequestId_(sheet, requestId, payload.rowNumber);
    var oldDisplay = sheet.getRange(row, 1, 1, 17).getDisplayValues()[0];
    if(payload.revision && payload.revision!==customerEditRevision_(oldDisplay,customerEditTeachers_(requestId)))throw new Error('تغير الطلب منذ فتحه. أعد فتح الطلب وراجع التغييرات قبل الحفظ.');
    var normalized = adminValidateEditable_(payload);
    var newValues = oldDisplay.slice(0);

    newValues[2] = normalized.name;
    newValues[3] = displayPhone_(normalized.mainPhone);
    newValues[4] = normalized.altPhone ? displayPhone_(normalized.altPhone) : '';
    newValues[5] = normalized.governorate;
    newValues[6] = normalized.district;
    newValues[7] = normalized.address;
    newValues[8] = normalized.itemsCount;
    newValues[9] = normalized.folderCount;
    newValues[10] = normalized.paperCount;
    newValues[11] = normalized.productsTotal;
    newValues[12] = normalized.deliveryFee;
    newValues[13] = normalized.grandTotal;
    newValues[14] = normalized.itemsText;
    newValues[15] = normalized.notes;

    sheet.getRange(row, 3, 1, 14).setValues([newValues.slice(2, 16)]);
    var beforeMeta = adminGetMeta_(requestId, oldDisplay[0]);
    var afterMeta = adminUpsertMeta_(requestId, oldDisplay[0], adminMetaPatchFromPayload_(payload), auth.email);
    SpreadsheetApp.flush();

    adminLog_(auth.email, 'تعديل طلب', oldDisplay[0], requestId, row, oldDisplay, newValues);
    if (adminMetaChanged_(beforeMeta, afterMeta)) {
      adminLog_(auth.email, 'تحديث بيانات إدارية', oldDisplay[0], requestId, row, adminMetaArray_(beforeMeta), adminMetaArray_(afterMeta));
    }

    return {
      ok: true,
      message: 'تم تعديل الطلب رقم ' + oldDisplay[0] + ' بنجاح.',
      order: adminDecorateOrder_(adminRowToObject_(newValues, row), afterMeta)
    };
  } finally {
    lock.releaseLock();
  }
}

function adminCreateOrder(payload) {
  var auth = requireAdmin_();
  payload = payload || {};

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول الآن؛ حاول بعد لحظات.');

  try {
    var sheet = adminOrdersSheet_();
    ensureHeaders_(sheet);
    var normalized = adminValidateEditable_(payload);
    var requestId = 'ADMIN-' + Utilities.getUuid();
    var orderNumber = nextOrderNumber_(sheet);
    rememberOrderNumberFloor_(orderNumber);
    var rowNumber = sheet.getLastRow() + 1;
    var values = [[
      orderNumber,
      new Date(),
      normalized.name,
      displayPhone_(normalized.mainPhone),
      normalized.altPhone ? displayPhone_(normalized.altPhone) : '',
      normalized.governorate,
      normalized.district,
      normalized.address,
      normalized.itemsCount,
      normalized.folderCount,
      normalized.paperCount,
      normalized.productsTotal,
      normalized.deliveryFee,
      normalized.grandTotal,
      normalized.itemsText,
      normalized.notes,
      requestId
    ]];

    var range = sheet.getRange(rowNumber, 1, 1, 17);
    range.setNumberFormats([adminOrderNumberFormats_()]);
    range.setValues(values);
    var meta = adminUpsertMeta_(requestId, orderNumber, adminMetaPatchFromPayload_(payload), auth.email);
    SpreadsheetApp.flush();

    adminLog_(auth.email, 'إضافة طلب', orderNumber, requestId, rowNumber, [], values[0]);

    return {
      ok: true,
      message: 'تم إنشاء الطلب رقم ' + orderNumber + ' بنجاح.',
      order: adminDecorateOrder_(adminRowToObject_(sheet.getRange(rowNumber, 1, 1, 17).getDisplayValues()[0], rowNumber), meta)
    };
  } finally {
    lock.releaseLock();
  }
}

/* الحذف الآمن: نسخ الطلب إلى محذوفات الإدارة ثم حذف الصف من ورقة الطلبات. */
function adminDeleteOrder(rowNumber, requestId) {
  var auth = requireAdmin_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول الآن؛ حاول بعد لحظات.');

  try {
    adminEnsureSupportSheets_();
    var sheet = adminOrdersSheet_();
    var row = adminFindRowByRequestId_(sheet, requestId, rowNumber);
    var raw = sheet.getRange(row, 1, 1, 17).getValues()[0];
    var display = sheet.getRange(row, 1, 1, 17).getDisplayValues()[0];
    var cleanRequestId = String(display[16] || '');
    var orderNumber = display[0];
    var meta = adminGetMeta_(cleanRequestId, orderNumber);
    var trash = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ADMIN_TRASH_SHEET_NAME);

    rememberOrderNumberFloor_(orderNumber);
    trash.appendRow(raw.concat([new Date(), auth.email, JSON.stringify(meta)]));
    sheet.deleteRow(row);
    adminRemoveMeta_(cleanRequestId);
    SpreadsheetApp.flush();

    adminLog_(auth.email, 'نقل إلى المحذوفات', orderNumber, cleanRequestId, row, display, []);

    return {
      ok: true,
      message: 'تم نقل الطلب رقم ' + orderNumber + ' إلى المحذوفات وحذف الصف الأصلي من الشيت.',
      deleted: { orderNumber: orderNumber, name: display[2], requestId: cleanRequestId }
    };
  } finally {
    lock.releaseLock();
  }
}

function adminListTrash() {
  requireAdmin_();
  adminEnsureSupportSheets_();
  var trash = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ADMIN_TRASH_SHEET_NAME);
  var last = trash.getLastRow();
  if (last < 2) return [];

  var rows = trash.getRange(2, 1, last - 1, 20).getDisplayValues();
  var result = [];
  for (var i = rows.length - 1; i >= 0 && result.length < 500; i--) {
    var r = rows[i];
    result.push({
      trashRow: i + 2,
      orderNumber: r[0] || '',
      orderDate: r[1] || '',
      name: r[2] || '',
      phone: r[3] || '',
      governorate: r[5] || '',
      district: r[6] || '',
      grandTotal: r[13] || 0,
      requestId: r[16] || '',
      deletedAt: r[17] || '',
      deletedBy: r[18] || ''
    });
  }
  return result;
}

function adminRestoreDeleted(requestId) {
  var auth = requireAdmin_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول الآن؛ حاول بعد لحظات.');

  try {
    adminEnsureSupportSheets_();
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    var trash = spreadsheet.getSheetByName(ADMIN_TRASH_SHEET_NAME);
    var trashRow = adminFindTrashRowByRequestId_(trash, requestId);
    var values = trash.getRange(trashRow, 1, 1, 20).getValues()[0];
    var original = values.slice(0, 17);
    var orderNumber = original[0];
    var cleanRequestId = String(original[16] || '');
    var sheet = adminOrdersSheet_();

    if (adminTryFindRowByRequestId_(sheet, cleanRequestId, null)) {
      throw new Error('يوجد طلب نشط بنفس معرّف الطلب، لا يمكن الاستعادة.');
    }

    var targetRow = sheet.getLastRow() + 1;
    var range = sheet.getRange(targetRow, 1, 1, 17);
    range.setNumberFormats([adminOrderNumberFormats_()]);
    range.setValues([original]);
    rememberOrderNumberFloor_(orderNumber);

    var meta = null;
    try { meta = values[19] ? JSON.parse(String(values[19])) : null; } catch (ignore) {}
    adminUpsertMeta_(cleanRequestId, orderNumber, meta || {}, auth.email);
    trash.deleteRow(trashRow);
    SpreadsheetApp.flush();

    adminLog_(auth.email, 'استعادة من المحذوفات', orderNumber, cleanRequestId, targetRow, [], original);
    return { ok: true, message: 'تمت استعادة الطلب رقم ' + orderNumber + ' إلى ورقة الطلبات.' };
  } finally {
    lock.releaseLock();
  }
}

function adminPermanentDelete(requestId) {
  var auth = requireAdmin_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول الآن؛ حاول بعد لحظات.');

  try {
    adminEnsureSupportSheets_();
    var trash = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ADMIN_TRASH_SHEET_NAME);
    var row = adminFindTrashRowByRequestId_(trash, requestId);
    var display = trash.getRange(row, 1, 1, 20).getDisplayValues()[0];
    trash.deleteRow(row);
    SpreadsheetApp.flush();
    adminLog_(auth.email, 'حذف نهائي من المحذوفات', display[0], display[16], row, display, []);
    return { ok: true, message: 'تم الحذف النهائي للطلب رقم ' + display[0] + ' من المحذوفات.' };
  } finally {
    lock.releaseLock();
  }
}

function adminSetOrderMeta(requestId, patch) {
  var auth = requireAdmin_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول الآن؛ حاول بعد لحظات.');
  try {
    var sheet = adminOrdersSheet_();
    var row = adminFindRowByRequestId_(sheet, requestId, null);
    var order = sheet.getRange(row, 1, 1, 17).getDisplayValues()[0];
    var before = adminGetMeta_(order[16], order[0]);
    var after = adminUpsertMeta_(order[16], order[0], patch || {}, auth.email);
    adminLog_(auth.email, 'تحديث بيانات إدارية', order[0], order[16], row, adminMetaArray_(before), adminMetaArray_(after));
    return { ok: true, message: 'تم تحديث الطلب رقم ' + order[0] + '.', meta: after };
  } finally {
    lock.releaseLock();
  }
}

function adminBulkSetStatus(requestIds, status) {
  var auth = requireAdmin_();
  requestIds = requestIds || [];
  status = cleanText_(status, 50);
  if (ADMIN_STATUSES.indexOf(status) === -1) throw new Error('حالة الطلب غير صحيحة.');
  if (!requestIds.length) throw new Error('حدد طلبًا واحدًا على الأقل.');
  if (requestIds.length > 300) throw new Error('الحد الأعلى للعملية الواحدة 300 طلب.');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول الآن؛ حاول بعد لحظات.');
  try {
    var sheet = adminOrdersSheet_();
    var updated = 0;
    for (var i = 0; i < requestIds.length; i++) {
      var requestId = cleanId_(requestIds[i], 80);
      var row = adminTryFindRowByRequestId_(sheet, requestId, null);
      if (!row) continue;
      var order = sheet.getRange(row, 1, 1, 17).getDisplayValues()[0];
      var before = adminGetMeta_(requestId, order[0]);
      var after = adminUpsertMeta_(requestId, order[0], { status: status }, auth.email);
      adminLog_(auth.email, 'تغيير حالة جماعي', order[0], requestId, row, adminMetaArray_(before), adminMetaArray_(after));
      updated++;
    }
    return { ok: true, message: 'تم تحديث حالة ' + updated + ' طلب.', updated: updated };
  } finally {
    lock.releaseLock();
  }
}

function adminDuplicateCheck(phone, excludeRequestId) {
  requireAdmin_();
  var canonical = canonicalPhone_(cleanText_(phone, 30));
  if (!canonical) return [];

  var sheet = adminOrdersSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var values = sheet.getRange(2, 1, last - 1, 17).getDisplayValues();
  var result = [];

  for (var i = values.length - 1; i >= 0 && result.length < 10; i--) {
    var r = values[i];
    if (String(r[16] || '') === String(excludeRequestId || '')) continue;
    var p1 = canonicalPhone_(r[3]);
    var p2 = canonicalPhone_(r[4]);
    if (canonical === p1 || canonical === p2) {
      result.push({ orderNumber: r[0], name: r[2], phone: r[3], requestId: r[16] });
    }
  }
  return result;
}

function adminOrderHistory(requestId) {
  requireAdmin_();
  adminEnsureSupportSheets_();
  requestId = cleanId_(requestId, 80);
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ADMIN_LOG_SHEET_NAME);
  var last = sheet.getLastRow();
  if (last < 2) return [];

  var rows = sheet.getRange(2, 1, last - 1, 8).getDisplayValues();
  var result = [];
  for (var i = rows.length - 1; i >= 0 && result.length < 50; i--) {
    if (String(rows[i][4] || '') !== requestId) continue;
    result.push({
      date: rows[i][0],
      email: rows[i][1],
      action: rows[i][2],
      orderNumber: rows[i][3],
      rowNumber: rows[i][5],
      details: adminHistoryDetails_(rows[i][2], rows[i][6], rows[i][7])
    });
  }
  return result;
}

function adminPreparationSummary(selector) {
  requireAdmin_();
  selector = selector || {};
  var ids = selector.requestIds || [];
  var idMap = {};
  for (var i = 0; i < ids.length; i++) idMap[String(ids[i])] = true;
  var useIds = ids.length > 0;
  var fromOrder = adminOptionalNumber_(selector.fromOrder);
  var toOrder = adminOptionalNumber_(selector.toOrder);
  if (!useIds && fromOrder === null && toOrder === null) {
    throw new Error('حدد طلبات من النتائج أو أدخل نطاق أرقام الطلبات.');
  }

  var sheet = adminOrdersSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return adminEmptyPreparationSummary_();
  var rows = sheet.getRange(2, 1, last - 1, 17).getDisplayValues();
  var summary = adminEmptyPreparationSummary_();
  var products = {};

  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var requestId = String(row[16] || '');
    var orderNo = adminOrderNumber_(row[0]);
    var selected = useIds ? Boolean(idMap[requestId]) : true;
    if (!selected) continue;
    if (!useIds && fromOrder !== null && orderNo < fromOrder) continue;
    if (!useIds && toOrder !== null && orderNo > toOrder) continue;

    summary.orderCount++;
    summary.itemsCount += numberFromDisplay_(row[8]);
    summary.folderCount += numberFromDisplay_(row[9]);
    summary.paperCount += numberFromDisplay_(row[10]);
    summary.productsTotal += numberFromDisplay_(row[11]);
    summary.deliveryTotal += numberFromDisplay_(row[12]);
    summary.grandTotal += numberFromDisplay_(row[13]);

    var parsed = adminParseItemsForSummary_(row[14]);
    for (var p = 0; p < parsed.length; p++) {
      var item = parsed[p];
      products[item.name] = (products[item.name] || 0) + item.qty;
    }

    if (cleanText_(row[15], 1500)) {
      summary.notes.push({ orderNumber: row[0], name: row[2], notes: row[15] });
    }
  }

  for (var name in products) {
    if (products.hasOwnProperty(name)) summary.products.push({ name: name, qty: products[name] });
  }
  summary.products.sort(function(a, b) { return b.qty - a.qty || a.name.localeCompare(b.name); });
  summary.productsTotal = adminRound2_(summary.productsTotal);
  summary.deliveryTotal = adminRound2_(summary.deliveryTotal);
  summary.grandTotal = adminRound2_(summary.grandTotal);
  return summary;
}

function adminDeliveryQueue() {
  requireAdmin_();
  var ready = adminListOrders({ status: 'جاهز', limit: 500 }).rows;
  var out = adminListOrders({ status: 'خرج للتوصيل', limit: 500 }).rows;
  var delivered = adminListOrders({ status: 'تم التسليم', limit: 1000 }).rows;
  var timezone = SpreadsheetApp.openById(SHEET_ID).getSpreadsheetTimeZone();
  var todayKey = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
  var deliveredToday = [];
  for (var i = 0; i < delivered.length; i++) {
    if (String(delivered[i].deliveredAt || '').indexOf(todayKey) === 0) deliveredToday.push(delivered[i]);
  }
  return { ready: ready, out: out, deliveredToday: deliveredToday };
}

function adminValidateEditable_(payload) {
  var name = cleanText_(payload.name, 100);
  var mainPhone = canonicalPhone_(cleanText_(payload.phone, 30));
  var altInput = cleanText_(payload.altPhone, 30);
  var altPhone = altInput ? canonicalPhone_(altInput) : '';
  var governorate = cleanText_(payload.governorate, 50);
  var district = cleanText_(payload.district, 100);
  var address = cleanText_(payload.address, 500);
  var itemsText = cleanText_(payload.itemsText, 4000);
  var notes = cleanText_(payload.notes, 1500);

  if (!name || !mainPhone || !governorate || !district || !address) {
    throw new Error('الاسم والهاتف والمحافظة واللواء والعنوان حقول إلزامية.');
  }
  if (altInput && !altPhone) throw new Error('رقم الهاتف البديل غير صحيح.');
  if (altPhone && altPhone === mainPhone) throw new Error('رقما الهاتف متطابقان.');
  if (!DISTRICTS[governorate] || DISTRICTS[governorate].indexOf(district) === -1) {
    throw new Error('المحافظة أو اللواء غير صحيح.');
  }
  if (!itemsText) throw new Error('أدخل تفاصيل المنتجات.');

  var itemsCount = adminNonNegative_(payload.itemsCount, 'إجمالي النسخ', true);
  var folderCount = adminNonNegative_(payload.folderCount, 'إجمالي المجلد', true);
  var paperCount = adminNonNegative_(payload.paperCount, 'إجمالي الورقي', true);
  var productsTotal = adminNonNegative_(payload.productsTotal, 'مجموع المنتجات', false);
  var deliveryFee = adminNonNegative_(payload.deliveryFee, 'رسوم التوصيل', false);
  var grandTotal = Math.round((productsTotal + deliveryFee) * 100) / 100;

  return {
    name: name,
    mainPhone: mainPhone,
    altPhone: altPhone,
    governorate: governorate,
    district: district,
    address: address,
    itemsCount: itemsCount,
    folderCount: folderCount,
    paperCount: paperCount,
    productsTotal: productsTotal,
    deliveryFee: deliveryFee,
    grandTotal: grandTotal,
    itemsText: itemsText,
    notes: notes
  };
}

function adminNonNegative_(value, label, integerOnly) {
  var number = Number(value);
  if (!isFinite(number) || number < 0 || (integerOnly && Math.floor(number) !== number)) {
    throw new Error(label + ' غير صحيح.');
  }
  return integerOnly ? number : adminRound2_(number);
}

function adminOrdersSheet_() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('لم يتم العثور على ورقة الطلبات.');
  return sheet;
}

function adminRowToObject_(row, rowNumber) {
  return {
    rowNumber: rowNumber,
    orderNumber: row[0] || '',
    orderDate: row[1] || '',
    name: row[2] || '',
    phone: row[3] || '',
    altPhone: row[4] || '',
    governorate: row[5] || '',
    district: row[6] || '',
    address: row[7] || '',
    itemsCount: row[8] || 0,
    folderCount: row[9] || 0,
    paperCount: row[10] || 0,
    productsTotal: row[11] || 0,
    deliveryFee: row[12] || 0,
    grandTotal: row[13] || 0,
    itemsText: row[14] || '',
    notes: row[15] || '',
    requestId: row[16] || ''
  };
}

function adminDecorateOrder_(order, meta) {
  meta = meta || adminDefaultMeta_(order.requestId, order.orderNumber);
  order.status = meta.status;
  order.paymentStatus = meta.paymentStatus;
  order.amountPaid = meta.amountPaid;
  order.priority = meta.priority;
  order.deliveryOutAt = meta.deliveryOutAt;
  order.deliveredAt = meta.deliveredAt;
  order.adminUpdatedAt = meta.updatedAt;
  return order;
}

function adminEnsureSupportSheets_() {
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  var meta = spreadsheet.getSheetByName(ADMIN_META_SHEET_NAME);
  if (!meta) {
    meta = spreadsheet.insertSheet(ADMIN_META_SHEET_NAME);
    meta.getRange(1, 1, 1, 10).setValues([[
      'معرّف الطلب', 'رقم الطلب', 'حالة الطلب', 'حالة الدفع', 'المبلغ المدفوع',
      'الأولوية', 'وقت الخروج للتوصيل', 'وقت التسليم', 'آخر تحديث', 'حساب الإدارة'
    ]]);
    meta.setFrozenRows(1);
  }

  var trash = spreadsheet.getSheetByName(ADMIN_TRASH_SHEET_NAME);
  if (!trash) {
    trash = spreadsheet.insertSheet(ADMIN_TRASH_SHEET_NAME);
    var orderHeaders = adminOrdersSheet_().getRange(1, 1, 1, 17).getDisplayValues()[0];
    trash.getRange(1, 1, 1, 20).setValues([orderHeaders.concat(['تاريخ الحذف', 'حذف بواسطة', 'بيانات الإدارة JSON'])]);
    trash.setFrozenRows(1);
  }

  var logSheet = spreadsheet.getSheetByName(ADMIN_LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = spreadsheet.insertSheet(ADMIN_LOG_SHEET_NAME);
    logSheet.getRange(1, 1, 1, 8).setValues([[
      'التاريخ', 'حساب الإدارة', 'العملية', 'رقم الطلب',
      'معرّف الطلب', 'رقم الصف', 'قبل التعديل', 'بعد التعديل'
    ]]);
    logSheet.setFrozenRows(1);
  }
}

function adminDefaultMeta_(requestId, orderNumber) {
  return {
    requestId: requestId || '',
    orderNumber: orderNumber || '',
    status: 'جديد',
    paymentStatus: 'غير مدفوع',
    amountPaid: 0,
    priority: 'عادي',
    deliveryOutAt: '',
    deliveredAt: '',
    updatedAt: '',
    updatedBy: ''
  };
}

function adminMetaMap_() {
  adminEnsureSupportSheets_();
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  var sheet = spreadsheet.getSheetByName(ADMIN_META_SHEET_NAME);
  var timezone = spreadsheet.getSpreadsheetTimeZone();
  var last = sheet.getLastRow();
  var map = {};
  if (last < 2) return map;
  var rows = sheet.getRange(2, 1, last - 1, 10).getValues();
  for (var i = 0; i < rows.length; i++) {
    var obj = adminMetaToObject_(rows[i], timezone);
    if (obj.requestId) map[obj.requestId] = obj;
  }
  return map;
}

function adminGetMeta_(requestId, orderNumber) {
  adminEnsureSupportSheets_();
  requestId = String(requestId || '');
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  var sheet = spreadsheet.getSheetByName(ADMIN_META_SHEET_NAME);
  var row = adminFindMetaRow_(sheet, requestId);
  if (!row) return adminDefaultMeta_(requestId, orderNumber);
  return adminMetaToObject_(sheet.getRange(row, 1, 1, 10).getValues()[0], spreadsheet.getSpreadsheetTimeZone());
}

function adminUpsertMeta_(requestId, orderNumber, patch, email) {
  adminEnsureSupportSheets_();
  patch = patch || {};
  requestId = String(requestId || '');
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  var sheet = spreadsheet.getSheetByName(ADMIN_META_SHEET_NAME);
  var row = adminFindMetaRow_(sheet, requestId);
  var current = row ? adminMetaToObject_(sheet.getRange(row, 1, 1, 10).getValues()[0], spreadsheet.getSpreadsheetTimeZone()) : adminDefaultMeta_(requestId, orderNumber);

  var status = cleanText_(patch.status, 50) || current.status;
  var paymentStatus = cleanText_(patch.paymentStatus, 50) || current.paymentStatus;
  var priority = cleanText_(patch.priority, 30) || current.priority;
  if (ADMIN_STATUSES.indexOf(status) === -1) status = 'جديد';
  if (ADMIN_PAYMENT_STATUSES.indexOf(paymentStatus) === -1) paymentStatus = 'غير مدفوع';
  if (ADMIN_PRIORITIES.indexOf(priority) === -1) priority = 'عادي';

  var amountPaid = patch.amountPaid === undefined || patch.amountPaid === null || patch.amountPaid === ''
    ? Number(current.amountPaid || 0)
    : adminNonNegative_(patch.amountPaid, 'المبلغ المدفوع', false);

  var deliveryOutAt = current.deliveryOutAt || '';
  var deliveredAt = current.deliveredAt || '';
  if (status === 'خرج للتوصيل' && !deliveryOutAt) deliveryOutAt = new Date();
  if (status === 'تم التسليم' && !deliveredAt) deliveredAt = new Date();

  var values = [[
    requestId,
    orderNumber || current.orderNumber || '',
    status,
    paymentStatus,
    amountPaid,
    priority,
    deliveryOutAt,
    deliveredAt,
    new Date(),
    email || current.updatedBy || ''
  ]];

  if (row) sheet.getRange(row, 1, 1, 10).setValues(values);
  else {
    row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, 10).setValues(values);
  }
  return adminMetaToObject_(values[0], spreadsheet.getSpreadsheetTimeZone());
}

function adminRemoveMeta_(requestId) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ADMIN_META_SHEET_NAME);
  if (!sheet) return;
  var row = adminFindMetaRow_(sheet, requestId);
  if (row) sheet.deleteRow(row);
}

function adminMetaToObject_(row, timezone) {
  timezone = timezone || SpreadsheetApp.openById(SHEET_ID).getSpreadsheetTimeZone();
  return {
    requestId: row[0] || '',
    orderNumber: row[1] || '',
    status: row[2] || 'جديد',
    paymentStatus: row[3] || 'غير مدفوع',
    amountPaid: Number(row[4]) || 0,
    priority: row[5] || 'عادي',
    deliveryOutAt: adminFormatDateTime_(row[6], timezone),
    deliveredAt: adminFormatDateTime_(row[7], timezone),
    updatedAt: adminFormatDateTime_(row[8], timezone),
    updatedBy: row[9] || ''
  };
}

function adminMetaPatchFromPayload_(payload) {
  return {
    status: payload.status,
    paymentStatus: payload.paymentStatus,
    amountPaid: payload.amountPaid,
    priority: payload.priority
  };
}

function adminMetaArray_(meta) {
  return [meta.status, meta.paymentStatus, meta.amountPaid, meta.priority, meta.deliveryOutAt, meta.deliveredAt];
}

function adminMetaChanged_(a, b) {
  return JSON.stringify(adminMetaArray_(a)) !== JSON.stringify(adminMetaArray_(b));
}

function adminFindMetaRow_(sheet, requestId) {
  if (!requestId || sheet.getLastRow() < 2) return null;
  var finder = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(requestId)).matchEntireCell(true).findNext();
  return finder ? finder.getRow() : null;
}

function adminFindRowByRequestId_(sheet, requestId, rowHint) {
  var row = adminTryFindRowByRequestId_(sheet, requestId, rowHint);
  if (!row) throw new Error('الطلب غير موجود أو تغير موضعه. ابحث عنه من جديد.');
  return row;
}

function adminTryFindRowByRequestId_(sheet, requestId, rowHint) {
  requestId = cleanId_(requestId, 80);
  if (!requestId) return null;
  var last = sheet.getLastRow();
  var hint = Number(rowHint);
  if (isFinite(hint) && hint >= 2 && hint <= last) {
    if (String(sheet.getRange(hint, 17).getDisplayValue() || '') === requestId) return hint;
  }
  if (last < 2) return null;
  var finder = sheet.getRange(2, 17, last - 1, 1)
    .createTextFinder(requestId).matchEntireCell(true).findNext();
  return finder ? finder.getRow() : null;
}

function adminFindTrashRowByRequestId_(sheet, requestId) {
  requestId = cleanId_(requestId, 80);
  if (!requestId || sheet.getLastRow() < 2) throw new Error('الطلب غير موجود في المحذوفات.');
  var finder = sheet.getRange(2, 17, sheet.getLastRow() - 1, 1)
    .createTextFinder(requestId).matchEntireCell(true).findNext();
  if (!finder) throw new Error('الطلب غير موجود في المحذوفات.');
  return finder.getRow();
}

function adminOrderNumber_(value) {
  var n = Number(String(value || '').replace(/[^\d]/g, ''));
  return isFinite(n) ? n : 0;
}

function adminOptionalNumber_(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  var n = Number(value);
  return isFinite(n) ? n : null;
}

function adminDateKey_(value, timezone) {
  if (!value) return '';
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
}

function adminFormatDateTime_(value, timezone) {
  if (!value) return '';
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value || '');
  return Utilities.formatDate(date, timezone, 'yyyy-MM-dd HH:mm');
}

function adminRound2_(number) {
  return Math.round((Number(number) || 0) * 100) / 100;
}

function adminOrderNumberFormats_() {
  return [
    '0', 'yyyy-MM-dd HH:mm:ss', '@', '@', '@', '@', '@', '@',
    '0', '0', '0', '0.00', '0.00', '0.00', '@', '@', '@'
  ];
}

function adminEmptyPreparationSummary_() {
  return {
    orderCount: 0,
    itemsCount: 0,
    folderCount: 0,
    paperCount: 0,
    productsTotal: 0,
    deliveryTotal: 0,
    grandTotal: 0,
    products: [],
    notes: []
  };
}

function adminParseItemsForSummary_(text) {
  text = String(text || '');
  var lines = text.split(/\r?\n/);
  var result = [];
  var knownNames = [];
  var key;
  for (key in PRODUCTS) if (PRODUCTS.hasOwnProperty(key)) knownNames.push(PRODUCTS[key].name);

  for (var i = 0; i < lines.length; i++) {
    var line = cleanText_(lines[i], 500);
    if (!line) continue;
    var qtyMatch = line.match(/عدد\s*[\(\[]?\s*(\d+)/i);
    var qty = qtyMatch ? Number(qtyMatch[1]) : 1;
    if (!isFinite(qty) || qty < 1) qty = 1;

    var matchedKnown = false;
    for (var k = 0; k < knownNames.length; k++) {
      if (line.indexOf(knownNames[k]) !== -1) {
        result.push({ name: knownNames[k], qty: qty });
        matchedKnown = true;
        break;
      }
    }
    if (matchedKnown) continue;

    var name = line
      .replace(/^\s*\d+\s*[\)\.\-:]\s*/, '')
      .replace(/\s+عدد\s*[\(\[]?\s*\d+\s*[\)\]]?/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (name) result.push({ name: name.substring(0, 180), qty: qty });
  }
  return result;
}

function adminHistoryDetails_(action, beforeJson, afterJson) {
  if (!beforeJson && !afterJson) return '';
  var before = [], after = [];
  try { before = beforeJson ? JSON.parse(beforeJson) : []; } catch (ignore1) {}
  try { after = afterJson ? JSON.parse(afterJson) : []; } catch (ignore2) {}

  if ((action === 'تعديل طلب' || action === 'تعديل طلب بواسطة العميل') && before.length && after.length) {
    var labels = ['رقم الطلب','تاريخ الطلب','الاسم','الهاتف الأساسي','الهاتف البديل','المحافظة','اللواء','العنوان','إجمالي النسخ','المجلد','الورقي','مجموع المنتجات','رسوم التوصيل','الإجمالي','تفاصيل المنتجات','الملاحظات','معرّف الطلب'];
    var changes = [];
    for (var i = 0; i < Math.min(before.length, after.length); i++) {
      if (String(before[i]) !== String(after[i])) {
        changes.push(labels[i] + ': ' + String(before[i] || 'فارغ').substring(0, 80) + ' ← ' + String(after[i] || 'فارغ').substring(0, 80));
      }
    }
    return changes.join(' | ');
  }

  if ((action.indexOf('بيانات إدارية') !== -1 || action.indexOf('حالة') !== -1) && before.length && after.length) {
    var metaLabels = ['الحالة','الدفع','المدفوع','الأولوية','وقت الخروج','وقت التسليم'];
    var metaChanges = [];
    for (var m = 0; m < Math.min(before.length, after.length); m++) {
      if (String(before[m]) !== String(after[m])) metaChanges.push(metaLabels[m] + ': ' + String(before[m] || 'فارغ') + ' ← ' + String(after[m] || 'فارغ'));
    }
    return metaChanges.join(' | ');
  }

  return '';
}

function adminLog_(email, action, orderNumber, requestId, rowNumber, before, after) {
  adminEnsureSupportSheets_();
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  var logSheet = spreadsheet.getSheetByName(ADMIN_LOG_SHEET_NAME);
  logSheet.appendRow([
    new Date(),
    email,
    action,
    orderNumber,
    requestId,
    rowNumber,
    before && before.length ? JSON.stringify(before) : '',
    after && after.length ? JSON.stringify(after) : ''
  ]);
}

var AJYAL_SHEET = 'عملاء خدمة أجيال';
var AJYAL_STATUSES = ['جديد','تم التواصل','بانتظار بيانات الحساب','قيد التنفيذ','مكتمل','ملغي'];
var AJYAL_EMPLOYEES = ['ربيع','ابو الليث','اسراء','وليد','موظف جديد 1','موظف جديد 2'];
var AJYAL_GRADES = ['صف أول','صف ثاني','صف ثالث'];
function normalizeAjyal_(value, items) {
  value=value||{};
  if(value.enabled!==true) return [];
  var count=0;
  (Array.isArray(items)?items:[]).forEach(function(item){
    if(['grade1_bag','grade2_bag','grade3_bag'].indexOf(item.productId)!==-1) {
      var qty=Number(item.qty);
      if(!Number.isInteger(qty)||qty<0||qty>99) throw new Error('عدد الحقائب غير صحيح.');
      count+=qty;
    }
  });
  if(!Array.isArray(value.teachers) || value.teachers.length>count) throw new Error('عدد المشتركين في أجيال يجب ألا يتجاوز عدد الحقائب الكاملة.');
  return value.teachers.map(function(t){
    t=t||{};
    var name=cleanText_(t.teacherName,100),grade=cleanText_(t.grade,30),phone=canonicalPhone_(cleanText_(t.phone,30));
    if(!name||AJYAL_GRADES.indexOf(grade)===-1||!phone) throw new Error('يرجى إدخال اسم المعلم/المعلمة والصف ورقم واتساب الصحيح.');
    return {teacherName:name,grade:grade,phone:displayPhone_(phone)};
  });
}
function ajyalSheet_() {
  var ss=SpreadsheetApp.openById(SHEET_ID),sheet=ss.getSheetByName(AJYAL_SHEET);
  if(!sheet) {
    sheet=ss.insertSheet(AJYAL_SHEET);
    sheet.appendRow(['معرّف العميل','رقم الحجز','اسم المعلم','حساب أجيال السابق','الهاتف','الحالة','ملاحظات العميل','تاريخ الإنشاء','آخر تعديل','الصف','معرّف الحجز الأصلي','الموظف الذي أنجز الطلب']);
    sheet.setFrozenRows(1);
  } else {
    sheet.getRange(1,10,1,3).setValues([['الصف','معرّف الحجز الأصلي','الموظف الذي أنجز الطلب']]);
  }
  return sheet;
}
function ajyalCell_(value){var text=String(value||'');return /^[=+@-]/.test(text)?"'"+text:text;}
function ajyalFind_(sheet,id){if(sheet.getLastRow()<2)return null;var m=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();return m?m.getRow():null;}
function saveAjyal_(data,number,id) {
  var teachers=normalizeAjyal_(data.ajyal,data.items);
  if(!teachers.length) return;
  var sheet=ajyalSheet_(),now=new Date().toISOString();
  var existing=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,1).getDisplayValues().map(function(r){return r[0];}):[];
  var records=[];
  teachers.forEach(function(t,i){
    var customerId=id+'_teacher_'+(i+1);
    if(existing.indexOf(customerId)!==-1) return;
    records.push([customerId,String(number),ajyalCell_(t.teacherName),'',t.phone,'جديد','',now,now,t.grade,id]);
  });
  if(records.length) sheet.getRange(sheet.getLastRow()+1,1,records.length,11).setNumberFormat('@').setValues(records);
}
function serveAjyalAdmin_(){requireAdmin_();return HtmlService.createHtmlOutputFromFile('AjyalAdmin').setTitle('إدارة خدمة أجيال').addMetaTag('viewport','width=device-width,initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);}
function ajyalAdminList(filters) {
  requireAdmin_();filters=filters||{};
  var sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(AJYAL_SHEET);
  var width=sheet?Math.min(12,sheet.getLastColumn()):12;
  var rows=sheet&&sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,width).getDisplayValues():[];
  var employeeCounts={};AJYAL_EMPLOYEES.forEach(function(name){employeeCounts[name]=0;});rows.forEach(function(r){if(r[5]==='مكتمل'&&employeeCounts.hasOwnProperty(r[11]))employeeCounts[r[11]]++;});
  var statusCounts={};AJYAL_STATUSES.forEach(function(s){statusCounts[s]=0;});rows.forEach(function(r){if(statusCounts.hasOwnProperty(r[5]))statusCounts[r[5]]++;});
  var employee=cleanText_(filters.employee,100);
  var query=cleanText_(filters.query,150).toLowerCase(),status=cleanText_(filters.status,30);
  rows=rows.filter(function(r){return(!filters.followup||['مكتمل','ملغي'].indexOf(r[5])<0)&&(!employee||(r[5]==='مكتمل'&&r[11]===employee))&&(!status||r[5]===status)&&(!query||[r[1],r[2],r[4],r[9],r[11]].join(' ').toLowerCase().indexOf(query)!==-1);});
  rows.sort(function(a,b){return Number(a[1])-Number(b[1])||a[0].localeCompare(b[0],undefined,{numeric:true});});
  var offset=Math.max(0,Math.floor(Number(filters.offset)||0));
  return {statusCounts:statusCounts,employeeCounts:employeeCounts,total:rows.length,statuses:AJYAL_STATUSES,grades:AJYAL_GRADES,employees:AJYAL_EMPLOYEES,rows:rows.slice(offset,offset+100).map(function(r){return {requestId:r[0],orderNumber:r[1],teacherName:r[2],phone:r[4],status:r[5],notes:r[6],updatedAt:r[8],grade:r[9]||'',parentRequestId:r[10]||r[0],completedBy:r[5]==='مكتمل'?(r[11]||''):''};})};
}
function ajyalAdminUpdate(payload) {
  var actor=requireAdmin_();payload=payload||{};
  var id=cleanId_(payload.requestId,120),name=cleanText_(payload.teacherName,100),grade=cleanText_(payload.grade,30),phone=canonicalPhone_(payload.phone),status=cleanText_(payload.status,30);
  if(!id||!name||AJYAL_GRADES.indexOf(grade)===-1||!phone||AJYAL_STATUSES.indexOf(status)===-1)throw new Error('بيانات غير صحيحة.');
  var completedBy=status==='مكتمل'?cleanText_(payload.completedBy,100):'';
  if(actor.username&&status==='مكتمل')completedBy=actor.employee;
  if(status==='مكتمل'&&AJYAL_EMPLOYEES.indexOf(completedBy)===-1)throw new Error('اختر الموظف الذي أنجز الطلب قبل تحديد الحالة مكتمل.');
  var lock=LockService.getScriptLock();if(!lock.tryLock(20000))throw new Error('النظام مشغول، حاول مجددًا.');
  try {
    var sheet=ajyalSheet_(),row=ajyalFind_(sheet,id);if(!row)throw new Error('لم يتم العثور على العميل.');
    var old=sheet.getRange(row,1,1,12).getDisplayValues()[0];
    if(old[8]!==String(payload.updatedAt||''))throw new Error('تم تعديل السجل، حدّث القائمة أولًا.');
    if(actor.username&&old[5]==='مكتمل'&&status==='مكتمل'&&old[11])completedBy=old[11];
    old[2]=ajyalCell_(name);old[4]=displayPhone_(phone);old[5]=status;old[6]=ajyalCell_(cleanText_(payload.notes,1000));old[8]=new Date().toISOString();old[9]=grade;old[11]=completedBy;
    sheet.getRange(row,1,1,12).setNumberFormat('@').setValues([old]);return {ok:true};
  } finally {lock.releaseLock();}
}

function adminStickerSettings(){requireAdmin_();return JSON.parse(PropertiesService.getScriptProperties().getProperty('STICKER_BARCODE_ANCHOR')||'null');}
function adminSaveStickerSettings(payload){
  requireAdmin_();payload=payload||{};var order=1,barcode=String(payload.barcode||'').trim();
  if(!Number.isSafeInteger(order)||order<1||!/^\d{1,12}$/.test(barcode))throw new Error('أدخل رقم طلب مرجعي صحيح وباركود من 1 إلى 12 رقمًا.');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{var props=PropertiesService.getScriptProperties(),old=props.getProperty('STICKER_BARCODE_ANCHOR');if(!stickerAnchorEqual_(payload.previous,old))throw new Error('تغيرت إعدادات الباركود. أعد تحميل الصفحة.');
    var value={order:order,barcode:barcode};props.setProperty('STICKER_BARCODE_ANCHOR',JSON.stringify(value));return value;
  }finally{lock.releaseLock();}
}
function stickerVerifyPackaging_(row){
  var no=String(row[0]),text=String(row[14]||'').replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);}).replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);});
  var lines=text.split(/\r?\n/).filter(function(line){return /^\s*\d+\)/.test(line);}),qty=0,folder=0,paper=0;
  function value(line,label){var match=line.match(new RegExp('(?:^| — )'+label+':\\s*(\\d+)(?=\\s*(?: — |$))'));return match?Number(match[1]):null;}
  if(!lines.length)throw new Error('الطلب '+no+': تفاصيل المنتجات غير قابلة للتحقق. راجع تفاصيل الطلب في كشف Drive.');
  lines.forEach(function(line){var n=value(line,'العدد'),f=value(line,'مجلد'),p=value(line,'ورقي(?: فقط)?');if(n===null||n<1)throw new Error('الطلب '+no+': عدد منتج غير صحيح في كشف Drive.');if((f!==null||p!==null)&&(f||0)+(p||0)!==n)throw new Error('الطلب '+no+': مجموع الورقي والمجلد لا يساوي عدد المنتج. راجع كشف Drive.');qty+=n;folder+=f||0;paper+=p||0;});
  function count(value){var n=String(value||0).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);}).replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);}).replace(/,/g,'').trim();return /^\d+$/.test(n)?Number(n):NaN;}
  if(qty!==count(row[8])||folder!==count(row[9])||paper!==count(row[10]))throw new Error('الطلب '+no+': تفاصيل المنتجات لا تطابق أعمدة العدد/المجلد/الورقي في كشف Drive. أوقف التصدير وراجع الطلب.');
  return {itemsCount:qty,folderCount:folder,paperCount:paper};
}
function adminStickerOrders(selector){
  requireAdmin_();selector=selector||{};var from=Number(selector.from),to=Number(selector.to),offset=Number(selector.offset)||0;
  if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<1||to<from||to-from>1999||!Number.isSafeInteger(offset)||offset<0)throw new Error('حدد نطاقًا صحيحًا حتى 2000 رقم طلب لكل ملف.');
  var anchor=adminStickerSettings();if(!anchor)throw new Error('ثبّت رقم بداية الباركود أولًا.');if(!stickerAnchorEqual_(selector.anchor,JSON.stringify(anchor)))throw new Error('تغيرت إعدادات الباركود. أعد تحميلها قبل التصدير.');
  var sheet=adminOrdersSheet_(),rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues():[];
  var exported={};stickerExportLedger_().forEach(function(r){exported[r[0]]=true;});
  var selected=rows.filter(function(r){var n=adminOrderNumber_(r[0]);return n>=from&&n<=to&&(selector.includeExported||!exported[stickerExportKey_(r)]);});
  if(selector.order!=='sheet')selected.sort(function(a,b){return adminOrderNumber_(a[0])-adminOrderNumber_(b[0]);});
  var portalMeta=portalStickerMeta_();
  return {total:selected.length,rows:selected.slice(offset,offset+100).map(function(r){var order=adminRowToObject_(r,0),number=Number(anchor.barcode)+adminOrderNumber_(r[0])-1;if(!Number.isSafeInteger(number)||number<0||String(number).length>12)throw new Error('الباركود الناتج خارج النطاق للطلب '+r[0]);order.amountPaid=Number((portalMeta[order.requestId]||{}).amountPaid)||0;order.labelDue=adminRound2_(Math.max(0,numberFromDisplay_(order.grandTotal)-order.amountPaid));order.stickerRevision=portalDigest_(JSON.stringify([r,order.amountPaid]));order.stickerKey=stickerExportKey_(r);order.previouslyExported=!!exported[order.stickerKey];order.barcode=String(number).padStart(anchor.barcode.length,'0');return order;})};
}

function stickerAnchorEqual_(left,right){try{var a=left?JSON.parse(String(left)):null,b=right?JSON.parse(String(right)):null;return !a&&!b||!!a&&!!b&&Number(a.order)===Number(b.order)&&String(a.barcode)===String(b.barcode);}catch(e){return false;}}

var STICKER_EXPORT_SHEET='سجل تصدير الستكرات';
function stickerExportKey_(row){return String(row[16]||'order:'+adminOrderNumber_(row[0]));}
function stickerExportLedger_(){var sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(STICKER_EXPORT_SHEET);return sheet&&sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,8).getDisplayValues():[];}
function adminStickerExportSummary(){requireAdmin_();var rows=stickerExportLedger_();if(!rows.length)return {lastOrder:null,lastExportAt:'',lastExportDisplay:'',ordersCount:0};var ids={},max=0;rows.forEach(function(r){ids[r[0]]=true;max=Math.max(max,Number(r[1])||0);});var last=rows[rows.length-1];return {lastBatch:last[4],lastOrder:Number(last[1]),lastBarcode:last[2],highestOrder:max,lastExportAt:last[3],lastExportDisplay:Utilities.formatDate(new Date(last[3]),'Asia/Amman','yyyy/MM/dd HH:mm:ss'),ordersCount:Object.keys(ids).length};}
function adminRecordStickerExport(payload){
  var auth=requireAdmin_();payload=payload||{};var ids=payload.ids||[],batch=cleanId_(payload.batch,100),from=Number(payload.from),to=Number(payload.to);
  if(!batch||!Array.isArray(ids)||!ids.length||ids.length>2000||!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<1||to<from||to-from>1999)throw new Error('بيانات سجل التصدير غير صحيحة.');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var ledger=stickerExportLedger_(),sameBatch=ledger.filter(function(r){return r[4]===batch;});
    if(sameBatch.length&&(sameBatch.length!==ids.length||sameBatch.some(function(r){return ids.indexOf(r[0])<0;})))throw new Error('معرف الدفعة مستخدم لطلبات مختلفة. أعد تجهيز الملف.');
    var previewMeta=payload.revisions?portalStickerMeta_():{};var seen={},wanted={};ledger.forEach(function(r){seen[r[0]]=true;});ids.forEach(function(id){wanted[String(id)]=true;});
    var anchor=adminStickerSettings();if(!anchor||!stickerAnchorEqual_(payload.anchor,JSON.stringify(anchor)))throw new Error('تغيرت بداية الباركود. أعد تجهيز الملف.');
    var sheet=adminOrdersSheet_(),rows=sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues(),chosen=[];
    rows.forEach(function(row,i){var key=stickerExportKey_(row),num=adminOrderNumber_(row[0]);if(wanted[key]){if(payload.revisions&&payload.revisions[key]!==portalDigest_(JSON.stringify([row,Number((previewMeta[String(row[16])]||{}).amountPaid)||0])))throw new Error('تغيرت بيانات طلب منذ المعاينة. أعد معاينة الستكرات.');if(num<from||num>to)throw new Error('طلب خارج نطاق التصدير.');if(seen[key]&&!payload.includeExported&&!sameBatch.length)throw new Error('صُدّرت ستكرات بعض الطلبات من جلسة أخرى. حدّث الصفحة وأعد التصدير.');chosen.push({key:key,num:num,row:i+2});}});
    if(chosen.length!==ids.length)throw new Error('تغيرت قائمة الطلبات. أعد تجهيز الملف.');
    var downloadCheck=workflowExportCheck_(payload,chosen,seen,sameBatch);
    if(sameBatch.length){workflowRecordDownload_(payload,chosen,downloadCheck);return adminStickerExportSummary();}
    chosen.sort(function(a,b){return a.num-b.num;});
    var ss=SpreadsheetApp.openById(SHEET_ID),log=ss.getSheetByName(STICKER_EXPORT_SHEET);if(!log){log=ss.insertSheet(STICKER_EXPORT_SHEET);log.getRange(1,1,1,7).setValues([['معرف الطلب','رقم الطلب','الباركود','وقت التصدير','معرف دفعة التصدير','عدد ستكرات الملف','الموظف']]);log.setFrozenRows(1);}
    var now=new Date().toISOString(),records=chosen.map(function(r){return[r.key,String(r.num),String(Number(anchor.barcode)+r.num-1).padStart(anchor.barcode.length,'0'),now,batch,String(payload.pages||''),auth.email||''];});
    var sortedRows=chosen.slice().sort(function(a,b){return a.row-b.row;}),ranges=[],start=sortedRows[0].row,end=start;sortedRows.slice(1).forEach(function(r){if(r.row===end+1)end=r.row;else{ranges.push('A'+start+':Q'+end);start=end=r.row;}});ranges.push('A'+start+':Q'+end);
    sheet.getRangeList(ranges).setBackground('#dff4e4');
    log.getRange(log.getLastRow()+1,1,records.length,7).setNumberFormat('@').setValues(records);
    workflowRecordDownload_(payload,chosen,downloadCheck);
    barcodeSyncAfterExport_(chosen);
    return adminStickerExportSummary();
  }finally{lock.releaseLock();}
}

function stickerSentMap_(ledger){var sent={};ledger.forEach(function(r){var key=String(r[0]),date=String(r[3]);if(!sent[key]||date<sent[key])sent[key]=date;});return sent;}

function courierCurrentBatch_(batch){
  requireAdmin_();batch=cleanId_(batch,100);if(!batch)throw new Error('اختر دفعة تصدير أولًا.');
  var ledger=stickerExportLedger_().filter(function(r){return r[4]===batch;}),wanted={};ledger.forEach(function(r){wanted[r[0]]={parcels:Number(r[7])||1,date:r[3],barcode:r[2]};});
  var sheet=adminOrdersSheet_(),rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues():[],meta=adminMetaMap_();
  var result=rows.filter(function(r){return wanted[stickerExportKey_(r)];}).map(function(r){var order=adminRowToObject_(r,0),m=meta[order.requestId]||{};return {key:stickerExportKey_(r),orderNumber:order.orderNumber,name:order.name,phone:order.phone,governorate:String(r[5]||''),due:adminRound2_(Math.max(0,numberFromDisplay_(order.grandTotal)-(Number(m.amountPaid)||0))),parcels:wanted[stickerExportKey_(r)].parcels};}).sort(function(a,b){return Number(a.orderNumber)-Number(b.orderNumber);});
  result.forEach(function(r){r.barcode=wanted[r.key].barcode;r.delivery=2;r.companyDue=adminRound2_(r.due-2);});
  return {batch:batch,date:ledger.length?Utilities.formatDate(new Date(ledger[0][3]),'Asia/Amman','yyyy/MM/dd HH:mm:ss'):'',rows:result};
}
function adminSaveCourierParcels(payload){
  requireAdmin_();payload=payload||{};var batch=cleanId_(payload.batch,100),values=payload.rows||[],map={};if(!batch||!Array.isArray(values)||values.length>2000)throw new Error('بيانات الدفعة غير صحيحة.');
  values.forEach(function(r){var n=Number(r.parcels);if(!Number.isInteger(n)||n<1||n>99)throw new Error('عدد الطرود بين 1 و99.');map[String(r.key)]=n;});
  var lock=LockService.getScriptLock();lock.waitLock(20000);try{var sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(STICKER_EXPORT_SHEET);if(!sheet||sheet.getLastRow()<2)throw new Error('لا يوجد سجل لهذه الدفعة.');var rows=sheet.getRange(2,1,sheet.getLastRow()-1,8).getDisplayValues(),found=0;
    var out=rows.map(function(r){if(r[4]===batch&&Object.prototype.hasOwnProperty.call(map,r[0])){found++;return [map[r[0]]];}return [r[7]||1];});if(found!==values.length)throw new Error('تغيرت بيانات الدفعة. أعد تحميل الكشف.');sheet.getRange(1,8).setValue('عدد الطرود');sheet.getRange(2,8,out.length,1).setValues(out);return {ok:true};
  }finally{lock.releaseLock();}
}

var COURIER_HANDOVER_SHEET='دفعات شركة التوصيل';
var COURIER_STATUS_SHEET='متابعة شركة التوصيل';
var COURIER_PAYMENT_SHEET='تسويات شركة التوصيل';
var COURIER_STATUSES=['لدى الشركة','تم التسليم','تعذّر التسليم','مرتجع'];
function courierRead_(name,width){var sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);return sheet&&sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,width).getDisplayValues():[];}
function courierAppend_(name,headers,rows){var ss=SpreadsheetApp.openById(SHEET_ID),sheet=ss.getSheetByName(name);if(!sheet){sheet=ss.insertSheet(name);sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);}if(rows.length)sheet.getRange(sheet.getLastRow()+1,1,rows.length,headers.length).setNumberFormat('@').setValues(rows.map(function(row){return row.map(ajyalCell_);}));}
function courierSnapshots_(){return courierRead_(COURIER_HANDOVER_SHEET,13).map(function(r){return {batch:r[0],key:r[1],orderNumber:r[2],barcode:r[3],name:r[4],phone:r[5],governorate:r[6],due:Number(r[7]),delivery:Number(r[8]),companyDue:Number(r[9]),handedAt:r[10],handedBy:r[11],company:r[12]||''};});}
function courierTracking_(){var map={};courierRead_(COURIER_STATUS_SHEET,6).forEach(function(r){map[r[0]]={status:r[1],reason:r[2],updatedAt:r[3],updatedBy:r[4]};});return map;}
function courierEnrich_(data,snapshots){var previousByKey={};snapshots.forEach(function(r){if(r.batch!==data.batch&&!previousByKey[r.key])previousByKey[r.key]=r;});var tracking=courierTracking_(),paid=courierRead_(COURIER_PAYMENT_SHEET,7).filter(function(r){return r[1]===data.batch;});data.confirmed=snapshots.some(function(r){return r.batch===data.batch;});data.payments=paid.map(function(r){return {id:r[0],amount:Number(r[2]),date:r[3],reference:r[4],recordedAt:r[5],recordedBy:r[6]};});data.paid=adminRound2_(paid.reduce(function(s,r){return s+Number(r[2]);},0));data.rows.forEach(function(row){var previous=previousByKey[row.key],state=tracking[row.key]||{};row.duplicateBatch=previous?previous.batch:'';row.courierStatus=state.status||(data.confirmed?'لدى الشركة':'لم يُسلّم للشركة');row.courierReason=state.reason||'';row.courierUpdatedAt=state.updatedAt||'';});data.expected=adminRound2_(data.rows.reduce(function(s,r){return s+r.companyDue;},0));data.remaining=adminRound2_(data.expected-data.paid);data.statuses=COURIER_STATUSES;return data;}
function adminCourierBatch(batch){requireAdmin_();batch=cleanId_(batch,100);var snapshots=courierSnapshots_(),saved=snapshots.filter(function(r){return r.batch===batch;}),data=saved.length?{batch:batch,date:adminFormatDateTime_(saved[0].handedAt,'Asia/Amman'),rows:saved}:courierCurrentBatch_(batch);return courierEnrich_(data,snapshots);}
function adminCourierBatches(){requireAdmin_();var groups={},snapshots=courierSnapshots_();stickerExportLedger_().forEach(function(r){var g=groups[r[4]]||(groups[r[4]]={batch:r[4],date:r[3],count:0,first:Number(r[1]),last:Number(r[1]),confirmed:false,expected:0,paid:0});g.count++;g.first=Math.min(g.first,Number(r[1]));g.last=Math.max(g.last,Number(r[1]));});snapshots.forEach(function(r){var g=groups[r.batch]||(groups[r.batch]={batch:r.batch,date:r.handedAt,count:0,first:Number(r.orderNumber),last:Number(r.orderNumber),confirmed:false,expected:0,paid:0});if(!g.confirmed){g.confirmed=true;g.count=0;}g.count++;g.first=Math.min(g.first,Number(r.orderNumber));g.last=Math.max(g.last,Number(r.orderNumber));g.expected+=r.companyDue;});courierRead_(COURIER_PAYMENT_SHEET,7).forEach(function(r){if(groups[r[1]])groups[r[1]].paid+=Number(r[2]);});return Object.keys(groups).map(function(k){var g=groups[k];g.expected=adminRound2_(g.expected);g.paid=adminRound2_(g.paid);g.remaining=adminRound2_(g.expected-g.paid);g.dateDisplay=adminFormatDateTime_(g.date,'Asia/Amman');return g;}).sort(function(a,b){return b.date.localeCompare(a.date);});}
function adminCourierHandover(payload){var auth=requireAdmin_();payload=payload||{};var batch=cleanId_(payload.batch,100),lock=LockService.getScriptLock();lock.waitLock(20000);try{var snapshots=courierSnapshots_();var saved=snapshots.filter(function(r){return r.batch===batch;});if(saved.length){barcodeSync_(saved);return adminCourierBatch(batch);}var company=barcodeCompany_(payload.company);var data=courierCurrentBatch_(batch),seen={};snapshots.forEach(function(r){seen[r.key]=true;});var duplicates=data.rows.filter(function(r){return seen[r.key];});if(duplicates.length&&!payload.excludeDuplicates)throw new Error('سبق تسليم '+duplicates.length+' طلب للشركة. اختر تسليم الطلبات غير المسلّمة فقط.');var signature=JSON.stringify(data.rows.map(function(r){return [r.key,r.barcode,r.name,r.phone,r.governorate,r.due];}));if(String(payload.signature||'')!==signature)throw new Error('تغيرت بيانات الطلبات منذ فتح الكشف. أعد تحميل الدفعة وراجع مبالغها.');var rows=data.rows.filter(function(r){return !seen[r.key];});if(!rows.length)throw new Error('لا توجد طلبات غير مسلّمة في هذه الدفعة.');barcodeCommit_(batch,company,rows);return adminCourierBatch(batch);}finally{lock.releaseLock();}}
function adminCourierSetStatus(payload){var auth=requireAdmin_();payload=payload||{};var batch=cleanId_(payload.batch,100),key=cleanId_(payload.key,150),status=cleanText_(payload.status,40),reason=cleanText_(payload.reason,500);if(COURIER_STATUSES.indexOf(status)<0)throw new Error('اختر حالة توصيل صحيحة.');if((status==='تعذّر التسليم'||status==='مرتجع')&&!reason)throw new Error('اكتب سبب تعذّر التسليم أو الإرجاع.');var lock=LockService.getScriptLock();lock.waitLock(20000);try{if(!courierSnapshots_().some(function(r){return r.batch===batch&&r.key===key;}))throw new Error('أكد تسليم الدفعة للشركة أولًا.');var current=courierTracking_()[key]||{};if(String(current.updatedAt||'')!==String(payload.updatedAt||''))throw new Error('تغيرت الحالة في جلسة أخرى. أعد تحميل الكشف.');courierAppend_(COURIER_STATUS_SHEET,['معرف الطلب','حالة التوصيل','السبب','وقت التعديل','الموظف','الدفعة'],[[key,status,reason,new Date().toISOString(),auth.email,batch]]);return adminCourierBatch(batch);}finally{lock.releaseLock();}}
function adminCourierRecordPayment(payload){var auth=requireAdmin_();payload=payload||{};var batch=cleanId_(payload.batch,100),id=cleanId_(payload.id,100),amount=Number(payload.amount),date=String(payload.date||''),reference=cleanText_(payload.reference,200);if(!id||!Number.isFinite(amount)||amount<=0||Math.abs(amount*100-Math.round(amount*100))>0.00001)throw new Error('أدخل مبلغًا موجبًا بدقة قرشين.');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw new Error('اختر تاريخ تحويل صحيح.');var lock=LockService.getScriptLock();lock.waitLock(20000);try{var existing=courierRead_(COURIER_PAYMENT_SHEET,7).filter(function(r){return r[0]===id;})[0];if(existing){if(existing[1]!==batch||Number(existing[2])!==amount||existing[3]!==date||existing[4]!==ajyalCell_(reference))throw new Error('معرف التحويل مستخدم ببيانات مختلفة.');return adminCourierBatch(batch);}var data=adminCourierBatch(batch);if(!data.confirmed)throw new Error('أكد تسليم الدفعة للشركة أولًا.');if(Math.round(amount*100)>Math.round(data.remaining*100))throw new Error('المبلغ أكبر من المتبقي على الشركة.');courierAppend_(COURIER_PAYMENT_SHEET,['معرف التحويل','الدفعة','المبلغ','تاريخ التحويل','المرجع','وقت التسجيل','الموظف'],[[id,batch,amount,date,reference,new Date().toISOString(),auth.email]]);return adminCourierBatch(batch);}finally{lock.releaseLock();}}

