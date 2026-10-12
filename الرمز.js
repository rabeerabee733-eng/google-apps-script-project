var SHEET_ID = '1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w';
var SHEET_NAME = 'الطلبات';
var WA_NUMBER = '0798382004';
var APP_VERSION = '2026-10-12-AJYAL-DRAFT-V1';
var ADMIN_VERSION = '2026-08-29-ADMIN-V2';
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
    soldOut: true
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
    soldOut: true
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

  var ajyal = normalizeAjyal_(data.ajyal);

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
      saveAjyal_(data, previousResult.orderNumber, requestId);
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
        governorate
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
      totals.productsTotal,               // L
      totals.deliveryFee,                 // M
      totals.grandTotal,                  // N
      itemsText_(items),                  // O
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

  return {
    result: 'success',
    code: 'ORDER_SAVED',
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
      ),
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
  governorate
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
    grandTotal:
      productsTotal +
      deliveryFee
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
      parts.push(
        'مجلد: ' +
        item.folderQty
      );

      parts.push(
        'ورقي: ' +
        item.paperQty
      );

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

function serveAdmin_() {
  var auth = adminAuth_();

  if (!auth.ok) {
    return HtmlService
      .createHtmlOutput(
        '<!doctype html><html lang="ar" dir="rtl"><head>' +
        '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>دخول غير مسموح</title></head>' +
        '<body style="font-family:Arial;background:#111;color:#fff;text-align:center;padding:60px 20px">' +
        '<h2 style="color:#d4af37">دخول غير مسموح</h2>' +
        '<p>افتح الرابط بعد تسجيل الدخول بالحساب الإداري المصرح له.</p>' +
        '</body></html>'
      )
      .setTitle('دخول غير مسموح')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  return HtmlService
    .createTemplateFromFile('Admin')
    .evaluate()
    .setTitle('إدارة طلبات التحضير الإلكتروني')
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

  for (var i = 0; i < display.length; i++) {
    var row = display[i];
    var requestId = String(row[16] || '');
    var meta = metaMap[requestId] || adminDefaultMeta_(requestId, row[0]);
    var grand = numberFromDisplay_(row[13]);
    var paid = Number(meta.amountPaid) || 0;
    var dateKey = adminDateKey_(raw[i][1], timezone);

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
  return adminDecorateOrder_(adminRowToObject_(values, row), meta);
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

  if (action === 'تعديل طلب' && before.length && after.length) {
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

// Ajyal records also serve as customer records; verification codes are never stored.
var AJYAL_SHEET = 'عملاء خدمة أجيال';
var AJYAL_STATUSES = ['جديد', 'تم التواصل', 'قيد التنفيذ', 'مكتمل', 'ملغي'];
function normalizeAjyal_(value) {
  value = value || {};
  if (value.enabled !== true) return null;
  var teacherName = cleanText_(value.teacherName, 100);
  var account = cleanText_(value.account, 150);
  if (!teacherName || !account) throw new Error('اسم المعلم وحساب أجيال مطلوبان.');
  return {teacherName: teacherName, account: account};
}
function ajyalSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(AJYAL_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(AJYAL_SHEET);
    sheet.appendRow(['معرّف الحجز','رقم الحجز','اسم المعلم','حساب أجيال','الهاتف','الحالة','ملاحظات العميل','تاريخ الإنشاء','آخر تعديل']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function ajyalCell_(value) {
  var text = String(value || '');
  return /^[=+@-]/.test(text) ? "'" + text : text;
}
function saveAjyal_(data, orderNumber, requestId) {
  var a = normalizeAjyal_(data.ajyal);
  if (!a) return;
  var sheet = ajyalSheet_();
  if (ajyalFind_(sheet, requestId)) return;
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row,1,1,9).setNumberFormat('@').setValues([[
    requestId, String(orderNumber), ajyalCell_(a.teacherName), ajyalCell_(a.account),
    displayPhone_(canonicalPhone_(data.phone)), 'جديد', '', new Date().toISOString(), new Date().toISOString()
  ]]);
}
function ajyalFind_(sheet, requestId) {
  if (sheet.getLastRow() < 2) return null;
  var match = sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(requestId).matchEntireCell(true).findNext();
  return match ? match.getRow() : null;
}
function serveAjyalAdmin_() {
  requireAdmin_();
  return HtmlService.createHtmlOutputFromFile('AjyalAdmin').setTitle('إدارة خدمة أجيال')
    .addMetaTag('viewport','width=device-width,initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}
function ajyalAdminList(filters) {
  requireAdmin_();
  filters = filters || {};
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(AJYAL_SHEET);
  var rows = sheet && sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,9).getDisplayValues() : [];
  var query = cleanText_(filters.query,150).toLowerCase();
  var status = cleanText_(filters.status,30);
  rows = rows.filter(function(r) { return (!status || r[5] === status) && (!query || [r[1],r[2],r[3],r[4]].join(' ').toLowerCase().indexOf(query) !== -1); });
  rows.sort(function(a,b) { return Number(a[1])-Number(b[1]) || a[0].localeCompare(b[0]); });
  var offset = Math.max(0,Math.floor(Number(filters.offset)||0));
  return {total:rows.length, statuses:AJYAL_STATUSES, rows:rows.slice(offset,offset+100).map(function(r) {
    return {requestId:r[0],orderNumber:r[1],teacherName:r[2],account:r[3],phone:r[4],status:r[5],notes:r[6],updatedAt:r[8]};
  })};
}
function ajyalAdminUpdate(payload) {
  requireAdmin_();
  payload = payload || {};
  var id = cleanId_(payload.requestId,80);
  var name = cleanText_(payload.teacherName,100);
  var account = cleanText_(payload.account,150);
  var status = cleanText_(payload.status,30);
  if (!id || !name || !account || AJYAL_STATUSES.indexOf(status) === -1) throw new Error('بيانات غير صحيحة.');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('النظام مشغول، حاول مجددًا.');
  try {
    var sheet = ajyalSheet_();
    var row = ajyalFind_(sheet,id);
    if (!row) throw new Error('لم يتم العثور على العميل.');
    var old = sheet.getRange(row,1,1,9).getDisplayValues()[0];
    if (old[8] !== String(payload.updatedAt || '')) throw new Error('تم تعديل السجل، حدّث القائمة أولًا.');
    old[2]=ajyalCell_(name); old[3]=ajyalCell_(account); old[5]=status;
    old[6]=ajyalCell_(cleanText_(payload.notes,1000)); old[8]=new Date().toISOString();
    sheet.getRange(row,1,1,9).setNumberFormat('@').setValues([old]);
    return {ok:true};
  } finally { lock.releaseLock(); }
}
