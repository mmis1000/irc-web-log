// webpack.config.js
const path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
        "channel-admin": "imports?$=jquery!./public/js/channel-admin.js",
        // only parts for initial view
        "channel-light" : [
            "normalize_css",
            "font_awesome",
            "channel_common_css",
            "header_css"
        ],
        // only parts for initial view
        "channel-light-admin" : [
            "normalize_css",
            "font_awesome",
            "channel_common_css",
            "channel_admin_css",
            "header_css"
        ],
        "channel-common": [
            "imports?fancybox,jquery_fancybox_buttons,jquery_fancybox_media,jquery_fancybox_thumbs,$=jquery,lazyload!./public/js/channel-common.js", 
            "imports?Hammer=hammerjs,google_material_icon,moment,polyfill_datepicker,$=jquery,lazyload!./public/js/header.js",
            "./public/js/scroll-fix.js"
        ],
        "channel-common-with-live": [
            "imports?fancybox,jquery_fancybox_buttons,jquery_fancybox_media,jquery_fancybox_thumbs,$=jquery,lazyload!./public/js/channel-common.js", 
            "imports?Hammer=hammerjs,google_material_icon,moment,polyfill_datepicker,$=jquery,lazyload!./public/js/header.js", 
            "imports?moment,$=jquery,io=socket_io,md5!./public/js/live.js",
            "./public/js/scroll-fix.js"
        ]
    },
    output: {
        path: path.join(__dirname, "public/packed"),
        filename: "[name].entry.js",
        publicPath: "/packed/"
    },
    module: {
        loaders: [
            // Extract css files
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader?minimize")
            },
            
            { 
                test: /jquery\.fancybox\.pack\.js$/, 
                loader:
                    "imports?jQuery=jquery,fancybox_css,jquery_mousewheel,jquery_fancybox_buttons_css,jquery_fancybox_thumbs_css"
            },
            {
                test: /(\/jquery\.fancybox-|\/jquery\.mousewheel-).+\.js$/,
                loader:
                    "imports?jQuery=jquery"
            },
            { test: /polyfill-datepicker\.js$/, loader:'imports?$=jquery,bootstrap_material_datetimepicker'},
            { test: /bootstrap-material-datetimepicker\.js$/, loader: "imports?moment,jQuery=jquery,bootstrap_material_datetimepicker_css" },
            { test: /jquery\.lazyload\.js$$/, loader: "imports?jQuery=jquery" },
            
            { test: /\.js$/, loader: 'uglify' },
            
            { test: /\.eot/, loader: 'url-loader?limit=10000&mimetype=application/vnd.ms-fontobject' },
            { test: /\.woff2(\?\S*)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff2' },
            { test: /\.woff(\?\S*)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
            { test: /\.ttf(\?\S*)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-ttf' },
            { test: /\.svg(\?\S*)?$/, loader: 'url-loader?limit=10000&mimetype=image/svg+xml' },
            { test: /\.png$|\.jpg$|\.webp$|\.gif/, loader: 'file-loader' }
        ]
    },
    resolve: {
        root: path.resolve(__dirname, 'public/'),
        extensions: ['', '.js', '.json', '.html', '.css'],
        alias: {
            "jquery": 
                path.resolve(__dirname, "public/components/jquery/dist/jquery.min.js"),
            "fancybox": 
                path.resolve(__dirname, "public/components/fancybox/source/jquery.fancybox.pack.js"),
            "bootstrap_material_datetimepicker": 
                path.resolve(__dirname, "public/components/bootstrap-material-datetimepicker/js/bootstrap-material-datetimepicker.js"),
            "moment":
                path.resolve(__dirname, "public/components/moment/moment.js"),
            "md5":
                path.resolve(__dirname, "public/js/md5.min.js"),
            "hammerjs":
                path.resolve(__dirname, "public/components/hammerjs/hammer.js"),
            "socket_io":
                path.resolve(__dirname, "node_modules/socket.io/node_modules/socket.io-client/"),
            "lazyload":
                path.resolve(__dirname, "public/js/jquery.lazyload.js"),
            "polyfill_datepicker":
                path.resolve(__dirname, "public/js/polyfill-datepicker.js"),
            "bootstrap_material_datetimepicker_css": 
                path.resolve(__dirname, "public/components/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css"),
            "channel_common_css": 
                path.resolve(__dirname, "public/css/channel.css"),
            "channel_admin_css": 
                path.resolve(__dirname, "public/css/channel-admin.css"),
            "header_css": 
                path.resolve(__dirname, "public/css/header.css"),
            "google_material_icon": 
                path.resolve(__dirname, "public/css/google-material-icon.css"),
            "font_awesome": 
                path.resolve(__dirname, "public/components/font-awesome/css/font-awesome.min.css"),
            "normalize_css":
                path.resolve(__dirname, "public/components/normalize-css/normalize.css"),
                
            "fancybox_css":
                path.resolve(__dirname, "public/components/fancybox/source/jquery.fancybox.css"),
            "jquery_mousewheel":
                path.resolve(__dirname, "public/components/fancybox/lib/jquery.mousewheel-3.0.6.pack.js"),
            "jquery_fancybox_buttons_css":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-buttons.css"),
            "jquery_fancybox_buttons":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-buttons.js"),
            "jquery_fancybox_media":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-media.js"),
            "jquery_fancybox_thumbs":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-thumbs.js"),
            "jquery_fancybox_thumbs_css":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-thumbs.css"),
        } 
    },
    // Use the plugin to specify the resulting filename (and add needed behavior to the compiler)
    plugins: [
        new ExtractTextPlugin("[name].css")
    ]
}

        // "/components/fancybox/lib/jquery.mousewheel-3.0.6.pack.js", 
        // "/components/fancybox/source/jquery.fancybox.css?v=2.1.5",      
        // "/components/fancybox/source/helpers/jquery.fancybox-buttons.css?v=1.0.5",                                                                                                      
        // "/components/fancybox/source/helpers/jquery.fancybox-buttons.js?v=1.0.5",                                                                                                      
        // "/components/fancybox/source/helpers/jquery.fancybox-media.js?v=1.0.6",                                                                                                 
        // "/components/fancybox/source/helpers/jquery.fancybox-thumbs.css?v=1.0.7",                                                                                                 
        // "/components/fancybox/source/helpers/jquery.fancybox-thumbs.js?v=1.0.7",