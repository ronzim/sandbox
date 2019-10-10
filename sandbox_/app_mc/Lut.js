/**
 * @author daron1337 / http://daron1337.github.io/
 */

THREE.Lut = function ( colorMap, numberofcolors ) {

	this.lut = new Array();
	this.map = THREE.ColorMapKeywords[ colorMap ];
	this.n = numberofcolors;
	this.mapname = colorMap;

	var step = 1.0 / this.n;

	for ( var i = 0; i <= 1; i+=step ) {

		for ( var j = 0; j < this.map.length - 1; j++ ) {

			if ( i >= this.map[ j ][ 0 ] && i < this.map[ j + 1 ][ 0 ] ) {

				var min = this.map[ j ][ 0 ];
				var max = this.map[ j + 1 ][ 0 ];

				var color = new THREE.Color( 0xFFFFFF );
				var minColor = new THREE.Color( 0xFFFFFF ).setHex( this.map[ j ][ 1 ] );
				var maxColor = new THREE.Color( 0xFFFFFF ).setHex( this.map[ j + 1 ][ 1 ] );

				color = minColor.lerp( maxColor, ( i - min ) / ( max - min ) );

				this.lut.push(color);

			}

		}

	}

	return this.set( this );

};

THREE.Lut.prototype = {

	constructor: THREE.Lut,

	lut: [], map: [], mapname: 'cooltowarm' , n: 256, minV: 0.0, maxV: 1.0, legend: false,

	set: function ( value ) {

		if ( value instanceof THREE.Lut ) {

			this.copy( value );

		}

		return this;

	},

	setMin: function ( min ) {

		this.minV = parseFloat( min );

		return this;

	},

	setMax: function ( max ) {

		this.maxV = parseFloat( max );

		return this;

	},

	changeNumberOfColors: function ( numberofcolors ) {

		this.n = numberofcolors;

		return new THREE.Lut( this.mapname, this.n );

	},

	changeColorMap: function ( colorMap ) {

		this.mapname = colorMap;

		return new THREE.Lut( this.mapname, this.n );

	},

  copy: function ( lut ) {

		this.lut = lut.lut;
		this.mapname = lut.mapname;
		this.map = lut.map;
		this.n = lut.n;
		this.minV = parseFloat( lut.minV );
		this.maxV = parseFloat( lut.maxV );

		return this;

	},

  getColor: function ( alpha ) {

	if ( alpha <= this.minV ) {

		alpha = this.minV;

	}

	 else if ( alpha >= this.maxV ) {

		alpha = this.maxV;

	}

  if ( this.maxV == this.minV ) { alpha = alpha - this.minV; }

  else { alpha = ( alpha - this.minV ) / ( this.maxV - this.minV ); }

  var colorPosition = Math.round ( alpha * this.n );

  colorPosition == this.n ? colorPosition -= 1 : colorPosition;

	return this.lut[ colorPosition ];

  },

  addColorMap: function ( colorMapName, arrayOfColors ) {

	THREE.ColorMapKeywords[ colorMapName ] = arrayOfColors;

  },

  setLegendOn: function ( parameters ) {

		if ( parameters === undefined ) { parameters = {}; }

		this.legend = {};

		this.legend.canvas = window.document.getElementById( 'legend' );
		this.legend.ctx = this.legend.canvas.getContext( '2d' );
		this.legend.ctx.clearRect( 0, 0, 50, 512 );
		this.legend.canvas.setAttribute( 'width',  50 );
		this.legend.canvas.setAttribute( 'height', 256 );

		imageData = this.legend.ctx.getImageData( 0, 0, 1, this.n );

		data = imageData.data;
		len = data.length;

		this.map = THREE.ColorMapKeywords[ this.mapname ];

		var k = 0;

		this.legend.ctx.scale(1,0.5);

		var step = 1.0 / this.n;

		var rectY = 512 / this.n;

		for ( var i = 1; i >= 0; i-=step ) {

			for ( var j = this.map.length - 1; j >= 0; j-- ) {

				if ( i < this.map[ j ][ 0 ] && i >= this.map[ j - 1 ][ 0 ]  ) {

					var min = this.map[ j - 1 ][ 0 ];
					var max = this.map[ j ][ 0 ];
					var color = new THREE.Color( 0xFFFFFF );
					var minColor = new THREE.Color( 0xFFFFFF ).setHex( this.map[ j - 1][ 1 ] );
					var maxColor = new THREE.Color( 0xFFFFFF ).setHex( this.map[ j ][ 1 ] );
					color = minColor.lerp( maxColor, ( i - min ) / ( max - min ) );

					rectY = 512 / this.n;

					this.legend.ctx.fillStyle = '#'+color.getHexString();

					this.legend.ctx.fillRect( 0, k*(512/this.n), 100, 512/this.n );
					k+=1;

				}

			}

		}

		var dt = ( this.maxV - this.minV ) / 4.0;

		var top 					= Math.abs( this.maxV ) > 99 ? Math.round( this.maxV ) : this.maxV.toFixed( 2 );
		var middletop 		= Math.abs( this.minV + dt * 3 ) > 99 ? Math.round( this.minV + dt * 3 ) : ( this.minV + dt * 3 ).toFixed( 2 );
		var middle 				= Math.abs( this.minV + dt * 2 ) > 99 ? Math.round( this.minV + dt * 2 ) : ( this.minV + dt * 2 ).toFixed( 2 );
		var middlebottom 	= Math.abs( this.minV + dt ) > 99 ? Math.round( this.minV + dt     ) : ( this.minV + dt     ).toFixed( 2 );
		var bottom 				= Math.abs( this.minV ) > 99 ? Math.round( this.minV ) : this.minV.toFixed( 2 );

		var name = parameters.name;
		if ( name.length > 10 ) { name = 	name.slice(0,8)+'...';}

		$( '0xlegend-text-name' ).html( name );
		$( '0xlegend-text-top' ).html( top );
		$( '0xlegend-text-middle-top' ).html( middletop );
		$( '0xlegend-text-middle' ).html( middle );
		$( '0xlegend-text-middle-bottom' ).html( middlebottom ) ;
		$( '0xlegend-text-bottom' ).html( bottom );

		return this.legend;

  },

  setLegendOff: function () {

		var canvas = window.document.getElementById( 'legend' );

		var ctx = canvas.getContext( '2d' );
		ctx.clearRect( 0, 0, 50, 512 );

		$( '0xlegend-text-name' ).html('');
		$( '0xlegend-text-top' ).html('');
		$( '0xlegend-text-middle-top' ).html('');
		$( '0xlegend-text-middle' ).html('');
		$( '0xlegend-text-middle-bottom' ).html('');
		$( '0xlegend-text-bottom' ).html('');

		this.legend = null;

		return this.legend;

  }

};


THREE.ColorMapKeywords = {

	'rainbow'        : [ [ 0.0, '0x0000FF' ], [ 0.2, '0x00FFFF' ], [ 0.5, '0x00FF00' ], [ 0.8, '0xFFFF00'],  [1.0, '0xFF0000' ] ],
  'cooltowarm_old' : [ [ 0.0, '0x3C4EC2' ], [ 0.2, '0x9BBCFF' ], [ 0.5, '0xDCDCDC' ], [ 0.8, '0xF6A385'],  [1.0, '0xB40426' ] ],
  'blackbody'      : [ [ 0.0, '0x000000' ], [ 0.2, '0x780000' ], [ 0.5, '0xE63200' ], [ 0.8, '0xFFFF00'],  [1.0, '0xFFFFFF' ] ],
	'grayscale'      : [ [ 0.0, '0x000000' ], [ 0.2, '0x404040' ], [ 0.5, '0x7F7F80' ], [ 0.8, '0xBFBFBF'],  [1.0, '0xFFFFFF' ] ],
	// 'foo'      			 : [ [ 0.0, '0x000000' ], [ 0.2, '0xAAAAAA' ], [ 0.5, '0x95740D' ], [ 1.0, '0xFCF7E6'], [1.0, '0xFFFFFF' ] ],
  'foo'      			 : [ [ 0.0, '0x000000' ], [ 0.2, '0x95740D' ], [ 1.0, '0xF5F5F5']],
	'cooltowarm'     : [
		[ 0.0, '0x000059' ],
		[ 0.03125, '0x0A1061' ],
		[ 0.0625, '0x101E69' ],
		[ 0.09375, '0x172F73' ],
		[ 0.125, '0x204380' ],
		[ 0.15625, '0x29568A' ],
		[ 0.1875, '0x336591' ],
		[ 0.21875, '0x3D7499' ],
		[ 0.25, '0x4985A6' ],
		[ 0.28125, '0x5697B3' ],
		[ 0.3125, '0x63A7BF' ],
		[ 0.34375, '0x77BCD1' ],
		[ 0.375, '0x92D1E0' ],
		[ 0.40625, '0xA7DDE8' ],
		[ 0.4375, '0xBFEAF0' ],
		[ 0.46875, '0xD2F4F7' ],
		[ 0.5, '0xFCF5E6' ],
		[ 0.51, '0xF0FBFC' ],
		[ 0.52, '0xFCF0D9' ],
		[ 0.54, '0xFAE5C8' ],
		[ 0.5625, '0xF7D5B2' ],
		[ 0.59375, '0xF2BB96' ],
		[ 0.625, '0xEDA682' ],
		[ 0.65625, '0xE8906F' ],
		[ 0.6875, '0xE0755A' ],
		[ 0.71875, '0xD66349' ],
		[ 0.75, '0xC24B36' ],
		[ 0.78125, '0xB3362B' ],
		[ 0.8125, '0xA62821' ],
		[ 0.84375, '0x991818' ],
		[ 0.875, '0x8C1119' ],
		[ 0.90625, '0x800D20' ],
		[ 0.9375, '0x730E2C' ],
		[ 0.96875, '0x660E31' ],
		[ 1.0, '0x591236' ],
	],
	'musclebone' : [
		[0,'0x000000'],
		[0.00392156862745098,'0x020000'],
		[0.00784313725490196,'0x050000'],
		[0.011764705882352941,'0x080000'],
		[0.01568627450980392,'0x0A0001'],
		[0.0196078431372549,'0x0D0101'],
		[0.023529411764705882,'0x100101'],
		[0.027450980392156862,'0x120102'],
		[0.03137254901960784,'0x150102'],
		[0.03529411764705882,'0x180202'],
		[0.0392156862745098,'0x1A0202'],
		[0.043137254901960784,'0x1D0203'],
		[0.047058823529411764,'0x200203'],
		[0.050980392156862744,'0x220303'],
		[0.054901960784313725,'0x250304'],
		[0.058823529411764705,'0x280304'],
		[0.06274509803921569,'0x2a0304'],
		[0.06666666666666667,'0x2d0305'],
		[0.07058823529411765,'0x300405'],
		[0.07450980392156863,'0x330405'],
		[0.0784313725490196,'0x350405'],
		[0.08235294117647059,'0x380406'],
		[0.08627450980392157,'0x3b0506'],
		[0.09019607843137255,'0x3d0506'],
		[0.09411764705882353,'0x400507'],
		[0.09803921568627451,'0x430507'],
		[0.10196078431372549,'0x450607'],
		[0.10588235294117647,'0x480607'],
		[0.10980392156862745,'0x4b0608'],
		[0.11372549019607843,'0x4d0608'],
		[0.11764705882352941,'0x500608'],
		[0.12156862745098039,'0x530709'],
		[0.12549019607843137,'0x550709'],
		[0.12941176470588237,'0x580709'],
		[0.13333333333333333,'0x5b070a'],
		[0.13725490196078433,'0x5d080a'],
		[0.1411764705882353,'0x60080a'],
		[0.1450980392156863,'0x63080a'],
		[0.14901960784313725,'0x66080b'],
		[0.15294117647058825,'0x68090b'],
		[0.1568627450980392,'0x6b090b'],
		[0.1607843137254902,'0x6e090c'],
		[0.16470588235294117,'0x70090c'],
		[0.16862745098039217,'0x73090c'],
		[0.17254901960784313,'0x760a0c'],
		[0.17647058823529413,'0x780a0d'],
		[0.1803921568627451,'0x7b0a0d'],
		[0.1843137254901961,'0x7e0a0d'],
		[0.18823529411764706,'0x800b0e'],
		[0.19215686274509805,'0x830b0e'],
		[0.19607843137254902,'0x860b0e'],
		[0.2,'0x880b0f'],
		[0.20392156862745098,'0x8b0c0f'],
		[0.20784313725490197,'0x8e0c0f'],
		[0.21176470588235294,'0x900c0f'],
		[0.21568627450980393,'0x930c10'],
		[0.2196078431372549,'0x960c10'],
		[0.2235294117647059,'0x990d10'],
		[0.22745098039215686,'0x9b0d11'],
		[0.23137254901960785,'0x9e0d11'],
		[0.23529411764705882,'0xa10d11'],
		[0.23921568627450981,'0xa30e11'],
		[0.24313725490196078,'0xa60e12'],
		[0.24705882352941178,'0xa90e12'],
		[0.25098039215686274,'0xab0e12'],
		[0.2549019607843137,'0xae0f13'],
		[0.25882352941176473,'0xb10f13'],
		[0.2627450980392157,'0xb30f13'],
		[0.26666666666666666,'0xb60f14'],
		[0.27058823529411763,'0xb90f14'],
		[0.27450980392156865,'0xbb1014'],
		[0.2784313725490196,'0xbe1014'],
		[0.2823529411764706,'0xc11015'],
		[0.28627450980392155,'0xc31015'],
		[0.2901960784313726,'0xc61115'],
		[0.29411764705882354,'0xc91116'],
		[0.2980392156862745,'0xcc1116'],
		[0.30196078431372547,'0xce1116'],
		[0.3058823529411765,'0xd11216'],
		[0.30980392156862746,'0xd41217'],
		[0.3137254901960784,'0xd61217'],
		[0.3176470588235294,'0xd91217'],
		[0.3215686274509804,'0xdc1218'],
		[0.3254901960784314,'0xde1318'],
		[0.32941176470588235,'0xe11318'],
		[0.3333333333333333,'0xe41319'],
		[0.33725490196078434,'0xe61319'],
		[0.3411764705882353,'0xe91419'],
		[0.34509803921568627,'0xec1419'],
		[0.34901960784313724,'0xee141a'],
		[0.35294117647058826,'0xf1141a'],
		[0.3568627450980392,'0xf4151a'],
		[0.3607843137254902,'0xf6151b'],
		[0.36470588235294116,'0xf9151b'],
		[0.3686274509803922,'0xfc151b'],
		[0.37254901960784315,'0xff151b'],
		[0.3764705882352941,'0xff181b'],
		[0.3803921568627451,'0xff1b1b'],
		[0.3843137254901961,'0xff1e1a'],
		[0.38823529411764707,'0xff211a'],
		[0.39215686274509803,'0xff241a'],
		[0.396078431372549,'0xff2719'],
		[0.4,'0xff2a19'],
		[0.403921568627451,'0xff2d19'],
		[0.40784313725490196,'0xff3018'],
		[0.4117647058823529,'0xff3318'],
		[0.41568627450980394,'0xff3618'],
		[0.4196078431372549,'0xff3917'],
		[0.4235294117647059,'0xff3c17'],
		[0.42745098039215684,'0xff3f16'],
		[0.43137254901960786,'0xff4216'],
		[0.43529411764705883,'0xff4516'],
		[0.4392156862745098,'0xff4815'],
		[0.44313725490196076,'0xff4b15'],
		[0.4470588235294118,'0xff4e15'],
		[0.45098039215686275,'0xff5114'],
		[0.4549019607843137,'0xff5414'],
		[0.4588235294117647,'0xff5714'],
		[0.4627450980392157,'0xff5a13'],
		[0.4666666666666667,'0xff5d13'],
		[0.47058823529411764,'0xff6013'],
		[0.4745098039215686,'0xff6312'],
		[0.47843137254901963,'0xff6612'],
		[0.4823529411764706,'0xff6912'],
		[0.48627450980392156,'0xff6c11'],
		[0.49019607843137253,'0xff6f11'],
		[0.49411764705882355,'0xff7210'],
		[0.4980392156862745,'0xff7510'],
		[0.5019607843137255,'0xff7810'],
		[0.5058823529411764,'0xff7b0f'],
		[0.5098039215686274,'0xff7e0f'],
		[0.5137254901960784,'0xff810f'],
		[0.5176470588235295,'0xff830e'],
		[0.5215686274509804,'0xff860e'],
		[0.5254901960784314,'0xff890e'],
		[0.5294117647058824,'0xff8c0d'],
		[0.5333333333333333,'0xff8f0d'],
		[0.5372549019607843,'0xff920d'],
		[0.5411764705882353,'0xff950c'],
		[0.5450980392156862,'0xff980c'],
		[0.5490196078431373,'0xff9b0b'],
		[0.5529411764705883,'0xff9e0b'],
		[0.5568627450980392,'0xffa10b'],
		[0.5607843137254902,'0xffa40a'],
		[0.5647058823529412,'0xffa70a'],
		[0.5686274509803921,'0xffaa0a'],
		[0.5725490196078431,'0xffad09'],
		[0.5764705882352941,'0xffb009'],
		[0.5803921568627451,'0xffb10a'],
		[0.5843137254901961,'0xffb30a'],
		[0.5882352941176471,'0xffb40b'],
		[0.592156862745098,'0xffb50b'],
		[0.596078431372549,'0xffb60c'],
		[0.6,'0xffb70c'],
		[0.6039215686274509,'0xffb90d'],
		[0.6078431372549019,'0xffba0d'],
		[0.611764705882353,'0xffbb0e'],
		[0.615686274509804,'0xffbc0f'],
		[0.6196078431372549,'0xffbd0f'],
		[0.6235294117647059,'0xffbf10'],
		[0.6274509803921569,'0xffc010'],
		[0.6313725490196078,'0xffc111'],
		[0.6352941176470588,'0xffc211'],
		[0.6392156862745098,'0xffc312'],
		[0.6431372549019608,'0xffc512'],
		[0.6470588235294118,'0xffc613'],
		[0.6509803921568628,'0xffc713'],
		[0.6549019607843137,'0xffc814'],
		[0.6588235294117647,'0xffc915'],
		[0.6627450980392157,'0xffcb15'],
		[0.6666666666666666,'0xffcc16'],
		[0.6705882352941176,'0xffcd16'],
		[0.6745098039215687,'0xffce17'],
		[0.6784313725490196,'0xffcf17'],
		[0.6823529411764706,'0xffd118'],
		[0.6862745098039216,'0xffd218'],
		[0.6901960784313725,'0xffd319'],
		[0.6941176470588235,'0xffd41a'],
		[0.6980392156862745,'0xffd51a'],
		[0.7019607843137254,'0xffd71b'],
		[0.7058823529411765,'0xffd81b'],
		[0.7098039215686275,'0xffd91c'],
		[0.7137254901960784,'0xffda1c'],
		[0.7176470588235294,'0xffdc1d'],
		[0.7215686274509804,'0xffdd1d'],
		[0.7254901960784313,'0xffde1e'],
		[0.7294117647058823,'0xffdf1f'],
		[0.7333333333333333,'0xffe01f'],
		[0.7372549019607844,'0xffe220'],
		[0.7411764705882353,'0xffe320'],
		[0.7450980392156863,'0xffe421'],
		[0.7490196078431373,'0xffe521'],
		[0.7529411764705882,'0xffe622'],
		[0.7568627450980392,'0xffe822'],
		[0.7607843137254902,'0xffe923'],
		[0.7647058823529411,'0xffea24'],
		[0.7686274509803922,'0xffeb24'],
		[0.7725490196078432,'0xffec25'],
		[0.7764705882352941,'0xffee25'],
		[0.7803921568627451,'0xffef26'],
		[0.7843137254901961,'0xFFF026'],
		[0.788235294117647,'0xFFF127'],
		[0.792156862745098,'0xFFF12b'],
		[0.796078431372549,'0xFFF22f'],
		[0.8,'0xFFF233'],
		[0.803921568627451,'0xFFF237'],
		[0.807843137254902,'0xFFF23a'],
		[0.8117647058823529,'0xFFF33e'],
		[0.8156862745098039,'0xFFF342'],
		[0.8196078431372549,'0xFFF346'],
		[0.8235294117647058,'0xFFF34a'],
		[0.8274509803921568,'0xFFF44e'],
		[0.8313725490196079,'0xFFF452'],
		[0.8352941176470589,'0xFFF456'],
		[0.8392156862745098,'0xFFF45a'],
		[0.8431372549019608,'0xFFF55e'],
		[0.8470588235294118,'0xFFF562'],
		[0.8509803921568627,'0xFFF566'],
		[0.8549019607843137,'0xFFF569'],
		[0.8588235294117647,'0xFFF66d'],
		[0.8627450980392157,'0xFFF671'],
		[0.8666666666666667,'0xFFF675'],
		[0.8705882352941177,'0xFFF679'],
		[0.8745098039215686,'0xFFF77d'],
		[0.8784313725490196,'0xFFF781'],
		[0.8823529411764706,'0xFFF785'],
		[0.8862745098039215,'0xFFF789'],
		[0.8901960784313725,'0xFFF88d'],
		[0.8941176470588236,'0xFFF891'],
		[0.8980392156862745,'0xFFF895'],
		[0.9019607843137255,'0xFFF899'],
		[0.9058823529411765,'0xFFF89c'],
		[0.9098039215686274,'0xFFF9a0'],
		[0.9137254901960784,'0xFFF9a4'],
		[0.9176470588235294,'0xFFF9a8'],
		[0.9215686274509803,'0xFFF9ac'],
		[0.9254901960784314,'0xFFFab0'],
		[0.9294117647058824,'0xFFFab4'],
		[0.9333333333333333,'0xFFFab8'],
		[0.9372549019607843,'0xFFFabc'],
		[0.9411764705882353,'0xFFFbc0'],
		[0.9450980392156862,'0xFFFbc4'],
		[0.9490196078431372,'0xFFFbc8'],
		[0.9529411764705882,'0xFFFbcc'],
		[0.9568627450980393,'0xFFFccf'],
		[0.9607843137254902,'0xFFFcd3'],
		[0.9647058823529412,'0xFFFcd7'],
		[0.9686274509803922,'0xFFFcdb'],
		[0.9725490196078431,'0xFFFddf'],
		[0.9764705882352941,'0xFFFde3'],
		[0.9803921568627451,'0xFFFde7'],
		[0.984313725490196,'0xFFFdeb'],
		[0.9882352941176471,'0xFFFeef'],
		[0.9921568627450981,'0xFFFef3'],
		[0.996078431372549,'0xFFFef7'],
		[1,'0xFFFefb']
	]
};
